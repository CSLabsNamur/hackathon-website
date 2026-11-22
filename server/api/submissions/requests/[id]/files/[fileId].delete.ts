import * as v from "valibot";
import { submissionFileParamsSchema } from "#shared/schemas/submissions/files/params";
import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "submissions.delete.own");

  const editionId = await getCurrentEditionId();

  const {id, fileId} = await getValidatedRouterParams(event, v.parser(submissionFileParamsSchema));
  const participant = await getSubmissionActor(dbUser.id);
  const request = await prisma.submissionRequest.findUnique({where: {id}});

  if (!request) throw createError({statusCode: 404, statusMessage: "Demande de soumission introuvable."});
  if (request.type !== SubmissionType.FILE) {
    throw createError({statusCode: 400, statusMessage: "Cette demande n'attend pas de fichier."});
  }
  if (request.teamRequest && !participant.team) {
    throw createError({statusCode: 400, statusMessage: "Cette demande doit être soumise au niveau de l'équipe."});
  }

  const submission = await withSubmissionTransaction({
    editionId,
    userId: dbUser.id,
    request,
    teamId: participant.team?.id ?? null,
  }, async (db, existing) => {
    const file = existing?.files.find((candidate) => candidate.id === fileId);
    if (!existing || !file) throw createError({statusCode: 404, statusMessage: "Fichier introuvable."});

    await queueSubmissionFilesCleanup(db, [file]);
    await db.submissionFile.delete({where: {id: file.id}});

    if (existing.files.length === 1) {
      await db.submission.delete({where: {id: existing.id}});
      return null;
    }

    return db.submission.update({
      where: {id: existing.id},
      data: {updatedAt: new Date()},
      include: accessibleSubmissionInclude,
    });
  });

  event.waitUntil(Promise.resolve().then(() => processSupabaseCleanup(serverSupabaseServiceRole(event), "GENERAL")).catch((error) => {
    console.error("Erreur lors du nettoyage des fichiers de soumission:", error);
  }));

  return submission;
});
