import * as v from "valibot";
import idParamSchema from "#shared/schemas/id";
import createUploadSchema from "#shared/schemas/submissions/upload";
import formidable from "formidable";
import { fileTypeFromFile } from "file-type";
import fs from "node:fs";
import { serverSupabaseServiceRole } from "#supabase/server";
import {
  isAllowedExt,
  MAX_SUBMISSION_FILE_SIZE,
  sanitizeFilename,
  sha256File,
  SUBMISSIONS_BUCKET,
} from "~~/server/utils/submissionsFiles";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event, UserRole.USER);
  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));
  const participant = await getParticipant(user);

  const request = await prisma.submissionRequest.findUnique({where: {id}});
  if (!request) {
    throw createError({statusCode: 404, statusMessage: "Demande de soumission introuvable."});
  }

  if (dayjs().isAfter(dayjs(request.deadline))) {
    throw createError({statusCode: 403, statusMessage: "La date limite de soumission est dépassée."});
  }

  if (request.type !== SubmissionType.FILE) {
    throw createError({statusCode: 400, statusMessage: "Cette demande attend une réponse texte."});
  }

  const acceptedExts = normalizeAcceptedFormats(request.acceptedFormats);

  const [bodyRaw, files] = await formidable({
    allowEmptyFiles: false,
    keepExtensions: true,
    maxFileSize: MAX_SUBMISSION_FILE_SIZE,
    maxFiles: request.multiple ? 20 : 1,
    multiples: !!request.multiple,
  }).parse(event.node.req);

  const bodyFlat = Object.fromEntries(Object.entries(bodyRaw ?? {}).map(([key, value]) => {
    if (Array.isArray(value)) return [key, value[0]];
    return [key, value];
  }));

  const form = v.parse(createUploadSchema(acceptedExts), bodyFlat);

  if (form.skipped) {
    if (request.required) {
      throw createError({statusCode: 400, statusMessage: "Cette soumission est obligatoire."});
    }

    const upserted = await prisma.submission.upsert({
      where: {
        requestId_participantId: {
          requestId: id,
          participantId: participant.id,
        },
      },
      create: {
        skipped: true,
        content: null,
        request: {connect: {id}},
        participant: {connect: {id: participant.id}},
      },
      update: {
        skipped: true,
        content: null,
      },
      include: {files: true},
    });

    // Delete DB records and storage objects
    if (upserted.files.length) {
      const supabase = serverSupabaseServiceRole(event);
      await supabase.storage
        .from(SUBMISSIONS_BUCKET)
        .remove(upserted.files.map((f) => f.path));

      await prisma.submissionFile.deleteMany({where: {submissionId: upserted.id}});
    }

    return prisma.submission.findUnique({where: {id: upserted.id}, include: {files: true, request: true}});
  }

  const fileList = (files.files ?? []) as formidable.File[];
  if (!fileList.length) {
    throw createError({statusCode: 400, statusMessage: "Aucun fichier reçu."});
  }

  // TODO: Check if necessary, given formidable config
  if (!request.multiple && fileList.length > 1) {
    throw createError({statusCode: 400, statusMessage: "Un seul fichier est autorisé."});
  }

  const submission = await prisma.submission.upsert({
    where: {
      requestId_participantId: {
        requestId: id,
        participantId: participant.id,
      },
    },
    create: {
      skipped: false,
      content: null,
      request: {connect: {id}},
      participant: {connect: {id: participant.id}},
    },
    update: {
      skipped: false,
      content: null,
    },
    include: {files: true},
  });

  // If not multiple, replace existing files
  if (!request.multiple && submission.files.length) {
    const supabase = serverSupabaseServiceRole(event);
    await supabase.storage.from(SUBMISSIONS_BUCKET).remove(submission.files.map((f) => f.path));
    await prisma.submissionFile.deleteMany({where: {submissionId: submission.id}});
  }

  const supabase = serverSupabaseServiceRole(event);

  const createdFiles = [] as { path: string }[];

  try {
    for (const f of fileList) {
      const detected = await fileTypeFromFile(f.filepath);
      if (!detected) {
        throw createError({statusCode: 400, statusMessage: "Type de fichier non reconnu."});
      }

      if (!isAllowedExt(detected.ext, acceptedExts)) {
        throw createError({statusCode: 400, statusMessage: "Format de fichier non autorisé."});
      }

      // AV scan
      const scanner = await clamscan;
      if (scanner) {
        const scan = await scanner.scanFile(f.filepath);
        if (scan.isInfected) {
          throw createError({statusCode: 400, statusMessage: "Le fichier est infecté par un virus."});
        }
      } else {
        console.warn("[submissions] ClamAV unavailable; skipping virus scan.");
      }

      const sha256 = await sha256File(f.filepath);
      const originalName = f.originalFilename || `file.${detected.ext}`;
      const safeName = sanitizeFilename(originalName);

      // Deterministic-ish path to avoid collisions and allow upsert
      // TODO: change this to use UUID
      const storagePath = `${participant.id}/${id}/${sha256}_${safeName}`;

      const {data, error} = await supabase.storage
        .from(SUBMISSIONS_BUCKET)
        .upload(storagePath, fs.createReadStream(f.filepath), {
          cacheControl: "3600",
          upsert: true,
          contentType: detected.mime,
        });

      if (error || !data) {
        throw createError({statusCode: 500, statusMessage: "Erreur lors du téléversement du fichier."});
      }

      createdFiles.push({path: data.path});

      await prisma.submissionFile.create({
        data: {
          submissionId: submission.id,
          bucket: SUBMISSIONS_BUCKET,
          path: data.path,
          originalName,
          mimeType: detected.mime,
          size: f.size,
          sha256,
        },
      });

      // Cleanup temp file
      try {
        fs.unlinkSync(f.filepath);
      } catch { /* empty */
      }
    }
  } catch (e) {
    if (createdFiles.length) {
      await supabase.storage.from(SUBMISSIONS_BUCKET).remove(createdFiles.map((x) => x.path));
      await prisma.submissionFile.deleteMany({
        where: {
          submissionId: submission.id,
          path: {in: createdFiles.map((x) => x.path)},
        },
      });
      await prisma.submission.delete({where: {id: submission.id}});
    }
    throw e;
  }

  //return prisma.submission.findUnique({
  //  where: {id: submission.id},
  //  include: {files: true, request: true},
  //});

  return submission;
});
