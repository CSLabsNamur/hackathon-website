import schema from "#shared/schemas/teams/create";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.USER);

  const data = await readValidatedBody(event, v.parser(schema));

  return prisma.team.create({data});
});
