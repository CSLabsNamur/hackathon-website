import * as v from "valibot";
import submitTextSchema from "#shared/schemas/submissions/submitText";
import idParamSchema from "#shared/schemas/id";
import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "submissions.update.own");

  const editionId = await getCurrentEditionId();

  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));
  const participant = await getSubmissionActor(dbUser.id);
  const request = await prisma.submissionRequest.findUnique({where: {id}});

  if (!request) throw createError({statusCode: 404, statusMessage: "Demande de soumission introuvable."});
  if (request.type !== SubmissionType.TEXT) {
    throw createError({statusCode: 400, statusMessage: "Cette demande nécessite un ou plusieurs fichiers."});
  }
  if (request.teamRequest && !participant.team) {
    throw createError({statusCode: 400, statusMessage: "Cette demande doit être soumise au niveau de l'équipe."});
  }

  const data = await readValidatedBody(event, v.parser(submitTextSchema));

  if (request.required && (data.skipped || !data.content)) {
    throw createError({statusCode: 400, statusMessage: "Cette soumission est obligatoire."});
  }

  const submission = await withSubmissionTransaction({
    editionId,
    userId: dbUser.id,
    request,
    teamId: participant.team?.id ?? null,
    expectedUpdatedAt: data.expectedUpdatedAt,
    expectedTeamId: data.expectedTeamId,
  }, async (db, existing, actor) => {
    const payload = {skipped: data.skipped ?? false, content: data.skipped ? null : data.content};

    if (!existing) {
      return db.submission.create({
        data: {...payload, request: {connect: {id}}, participant: {connect: {id: actor.id}}},
        include: accessibleSubmissionInclude,
      });
    }

    await queueSubmissionFilesCleanup(db, existing.files);

    return db.submission.update({
      where: {id: existing.id},
      data: {...payload, files: {deleteMany: {}}},
      include: accessibleSubmissionInclude,
    });
  });

  event.waitUntil(Promise.resolve().then(() => processSupabaseCleanup(serverSupabaseServiceRole(event), "GENERAL")).catch((error) => {
    console.error("Erreur lors du nettoyage des fichiers de soumission:", error);
  }));

  return submission;
});
