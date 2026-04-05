import schema from "#shared/schemas/participants/edit";
import * as v from "valibot";
import type { ParticipantUpdateInput } from "~~/server/prisma/generated/prisma/models/Participant";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "participants.update.own");

  const {firstName, lastName, email, ...data} = await readValidatedBody(event, v.parser(schema));

  const payload: ParticipantUpdateInput = {
    ...data,
    user: {
      update: {
        firstName,
        lastName,
        email,
      },
    },
  };

  return prisma.participant.update({where: {userId: dbUser.id}, data: payload});
});
