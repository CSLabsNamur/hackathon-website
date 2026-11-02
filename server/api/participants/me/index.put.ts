import schema from "#shared/schemas/participants/edit";
import * as v from "valibot";
import type { ParticipantUpdateInput } from "~~/server/prisma/generated/prisma/models/Participant";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "participants.update.own");

  const {
    firstName,
    lastName,
    email,
    githubAccount,
    linkedInAccount,
    ...data
  } = await readValidatedBody(event, v.parser(schema));

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

  const supabase = createSupabaseAdminClient();
  const syncJob = await prepareAuthSync(dbUser.id);

  try {
    await updateAuthProfile(supabase, syncJob.supabaseAuthId, {firstName, lastName, email});

    const participant = await prisma.$transaction(async (db) => {
      await finishAuthSync(db, syncJob);
      return db.participant.update({where: {userId: dbUser.id}, data: payload});
    });

    await invalidateUserAuthorization(syncJob.supabaseAuthId);
    return participant;
  } catch (error) {
    await retryAuthSync(syncJob, error);
    throw createError({statusCode: 500, statusMessage: "Impossible de modifier le profil. La synchronisation du compte sera réessayée."});
  }
});
