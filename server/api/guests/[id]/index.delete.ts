import * as v from "valibot";
import idParamSchema from "#shared/schemas/id";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  return prisma.guest.delete({where: {id}});
});
