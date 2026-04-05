import idParamSchema from "#shared/schemas/id";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "teams.delete");

  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  return prisma.team.delete({where: {id}});
});
