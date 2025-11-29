import schema from "#shared/schemas/teams/edit";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);
  const teamId = getRouterParam(event, "id");

  const data = await readValidatedBody(event, v.parser(schema));

  return prisma.team.update({where: {id: teamId}, data});
});
