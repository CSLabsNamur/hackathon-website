import schema from "#shared/schemas/participants/edit";
import * as v from "valibot";
import type { ParticipantUpdateInput } from "~~/server/prisma/generated/prisma/models/Participant";
import idParamSchema from "#shared/schemas/id";

export default defineEventHandler(async (event) => {
  const {ability} = await requirePermission(event, "participants.update");

  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));
  const body = await readValidatedBody(event, v.parser(schema));
  const sensitiveFields = ["diet", "needs", "newsletter"] as const;

  if (sensitiveFields.some((field) => body[field] !== undefined)
    && !canUsePermission(ability, "participants.update.sensitive")) {
    throw createError({statusCode: 403, statusMessage: "Vous ne pouvez pas modifier les données sensibles des participants."});
  }

  const {
    firstName,
    lastName,
    email,
    githubAccount,
    linkedInAccount,
    ...data
  } = body;
  const payload: ParticipantUpdateInput = {
    ...data,
    githubAccount: githubAccount ?? null,
    linkedInAccount: linkedInAccount ?? null,
    user: {
      update: {
        firstName,
        lastName,
        email,
      },
    },
  };

  const participant = await prisma.participant.findUnique({where: {id}, select: {userId: true}});
  if (!participant) {
    throw createError({statusCode: 404, statusMessage: "Participant introuvable."});
  }

  const supabase = createSupabaseAdminClient();
  const syncJob = await prepareAuthSync(participant.userId);

  try {
    await updateAuthProfile(supabase, syncJob.supabaseAuthId, {firstName, lastName, email});

    const updatedParticipant = await prisma.$transaction(async (db) => {
      await finishAuthSync(db, syncJob);
      return db.participant.update({where: {id}, data: payload});
    });

    await invalidateUserAuthorization(syncJob.supabaseAuthId);
    return canUsePermission(ability, "participants.read.sensitive")
      ? updatedParticipant
      : {...updatedParticipant, diet: null, needs: null, imageAgreement: null, newsletter: null};
  } catch (error) {
    await retryAuthSync(syncJob, error);
    throw createError({statusCode: 500, statusMessage: "Impossible de modifier le profil. La synchronisation du compte sera réessayée."});
  }
});
