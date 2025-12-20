import schema from "#shared/schemas/participants/edit";
import * as v from "valibot";
import type { ParticipantUpdateInput } from "~~/server/prisma/generated/prisma/models/Participant";
import idParamSchema from "#shared/schemas/id";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  const id = await getValidatedRouterParams(event, v.parser(idParamSchema));

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

  return prisma.participant.update({where: {id}, data: payload});
});
