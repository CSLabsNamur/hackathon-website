import * as v from "valibot";
import idParamSchema from "#shared/schemas/id";
import createUploadSchema from "#shared/schemas/submissions/upload";
import { MAX_SUBMISSION_FILES, MAX_SUBMISSION_UPLOAD_SIZE } from "#shared/utils/fileUploads";
import formidable from "formidable";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { serverSupabaseServiceRole } from "#supabase/server";
import type { Prisma } from "~~/server/prisma/generated/prisma/client";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "submissions.update.own");

  const editionId = await getCurrentEditionId();

  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));
  const participant = await getSubmissionActor(dbUser.id);
  const request = await prisma.submissionRequest.findUnique({where: {id}});

  if (!request) throw createError({statusCode: 404, statusMessage: "Demande de soumission introuvable."});

  if (dayjs().isAfter(dayjs(request.deadline))) {
    throw createError({statusCode: 403, statusMessage: "La date limite de soumission est dépassée."});
  }

  if (request.type !== SubmissionType.FILE) {
    throw createError({statusCode: 400, statusMessage: "Cette demande attend une réponse texte."});
  }

  const team = request.teamRequest ? participant.team : null;
  if (request.teamRequest && !team) {
    throw createError({statusCode: 400, statusMessage: "Cette demande doit être soumise au niveau de l'équipe."});
  }

  const acceptedExts = normalizeAcceptedFormats(request.acceptedFormats);
  const temporaryFiles: string[] = [];
  const cleanupJobIds: string[] = [];
  const multipart = formidable({
    allowEmptyFiles: false,
    keepExtensions: true,
    maxFileSize: MAX_SUBMISSION_UPLOAD_SIZE,
    maxTotalFileSize: MAX_SUBMISSION_UPLOAD_SIZE,
    maxFiles: request.multiple ? MAX_SUBMISSION_FILES : 1,
  });
  multipart.on("fileBegin", (_name, file) => temporaryFiles.push(file.filepath));

  const supabase = serverSupabaseServiceRole(event);
  try {
    const [bodyRaw, files] = await multipart.parse(event.node.req);
    const body = Object.fromEntries(Object.entries(bodyRaw).map(([key, value]) => [key, value?.[0]]));
    const parsed = v.safeParse(createUploadSchema(acceptedExts, !!request.multiple), {
      ...body, ...(body.expectedUpdatedAt === "null" ? {expectedUpdatedAt: null} : {}),
      ...(body.expectedTeamId === "null" ? {expectedTeamId: null} : {}),
    });
    if (!parsed.success) throw createError({statusCode: 400, statusMessage: parsed.issues[0]!.message});

    const form = parsed.output;

    if (request.teamRequest && form.expectedTeamId !== undefined && form.expectedTeamId !== team?.id) {
      throw createError({statusCode: 409, statusMessage: "Votre équipe a changé. Rechargez la page."});
    }
    if (request.required && form.skipped) {
      throw createError({statusCode: 400, statusMessage: "Cette soumission est obligatoire."});
    }

    const fileList = files.files ?? [];
    if (!form.skipped && !fileList.length) {
      throw createError({statusCode: 400, statusMessage: "Aucun fichier reçu."});
    }
    if (Object.keys(files).some((key) => key !== "files") || (form.skipped && fileList.length)) {
      throw createError({statusCode: 400, statusMessage: "Contenu de l'envoi invalide."});
    }

    const uploadedFiles: Prisma.SubmissionFileCreateManySubmissionInput[] = [];
    if (!form.skipped) {
      const scanner = await clamscan;

      for (const file of fileList) {
        const originalName = file.originalFilename || "fichier";
        const detected = await detectSubmissionFileType(file.filepath, originalName);

        if (!detected || !isAllowedExt(detected.ext, acceptedExts)) {
          throw createError({statusCode: 400, statusMessage: "Type de fichier non reconnu ou format non autorisé."});
        }

        if (scanner && (await scanner.scanFile(file.filepath)).isInfected) {
          throw createError({statusCode: 400, statusMessage: "Le fichier est infecté par un virus."});
        }

        const sha256 = await sha256File(file.filepath);
        if (uploadedFiles.some((uploaded) => uploaded.sha256 === sha256 && uploaded.originalName === originalName)) {
          throw createError({statusCode: 400, statusMessage: "Un fichier est présent plusieurs fois dans l'envoi."});
        }

        const path = `${team ? `team/${team.id}` : participant.id}/${id}/${randomUUID()}_${sanitizeFilename(originalName)}`;
        const job = await prepareSupabaseCreation({type: "STORAGE_OBJECT", bucket: SUBMISSIONS_BUCKET, target: path});
        cleanupJobIds.push(job.id);

        const {error} = await supabase.storage.from(SUBMISSIONS_BUCKET).upload(path, createReadStream(file.filepath), {
          cacheControl: "3600", upsert: false, contentType: detected.mime,
        });

        if (error) throw createError({statusCode: 500, statusMessage: "Erreur lors du téléversement du fichier."});

        uploadedFiles.push({
          bucket: SUBMISSIONS_BUCKET,
          path,
          originalName,
          mimeType: detected.mime,
          size: file.size,
          sha256,
        });
      }
    }

    return await withSubmissionTransaction({
      editionId,
      userId: dbUser.id,
      request,
      teamId: participant.team?.id ?? null,
      expectedUpdatedAt: form.expectedUpdatedAt,
      expectedTeamId: form.expectedTeamId,
    }, async (db, existing, actor) => {
      if (request.multiple && !form.skipped && uploadedFiles.some((file) => existing?.files.some((saved) => saved.sha256 === file.sha256 && saved.originalName === file.originalName))) {
        throw createError({statusCode: 400, statusMessage: "Ce fichier est déjà présent dans le dépôt."});
      }

      if (cleanupJobIds.length) await finishSupabaseCreation(db, cleanupJobIds);

      const replace = !!(form.skipped || !request.multiple);
      if (replace && existing) await queueSubmissionFilesCleanup(db, existing.files);

      const data = {skipped: form.skipped ?? false, content: null};

      if (existing) {
        return db.submission.update({
          where: {id: existing.id},
          data: {
            ...data,
            files: {...(replace ? {deleteMany: {}} : {}), ...(uploadedFiles.length ? {createMany: {data: uploadedFiles}} : {})},
          },
          include: accessibleSubmissionInclude,
        });
      }

      return db.submission.create({
        data: {
          ...data,
          request: {connect: {id}},
          participant: {connect: {id: actor.id}}, ...(uploadedFiles.length ? {files: {createMany: {data: uploadedFiles}}} : {}),
        },
        include: accessibleSubmissionInclude,
      });
    });
  } catch (error) {
    if (cleanupJobIds.length) await retrySupabaseCleanup(cleanupJobIds);

    if (error && typeof error === "object" && "httpCode" in error && typeof error.httpCode === "number") {
      throw createError({
        statusCode: error.httpCode,
        statusMessage: "Envoi invalide : vérifiez le nombre de fichiers et la limite de 5 Mo par envoi.",
      });
    }

    throw error;
  } finally {
    await Promise.all(temporaryFiles.map((path) => unlink(path).catch(() => {
    })));
    event.waitUntil(Promise.resolve().then(() => processSupabaseCleanup(supabase, "GENERAL")).catch((error) => {
      console.error("Erreur lors du nettoyage des fichiers de soumission:", error);
    }));
  }
});
