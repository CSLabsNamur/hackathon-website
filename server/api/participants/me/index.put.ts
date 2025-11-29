import schema from "#shared/schemas/participants/caution";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event, UserRole.USER);

  const data = await readValidatedBody(event, v.parser(schema));

  return prisma.participant.update({where: {id: user.sub}, data})
});
