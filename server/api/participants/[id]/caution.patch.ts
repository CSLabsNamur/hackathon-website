import schema from "#shared/schemas/participants/caution";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);
  const userId = getRouterParam(event, "id");

  const data = await readValidatedBody(event, v.parser(schema));

  return prisma.participant.update({where: {id: userId}, data});
});
