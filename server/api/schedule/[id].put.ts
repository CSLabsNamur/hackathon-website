import schema from "#shared/schemas/schedule/edit";
import * as v from "valibot";
import idParamSchema from "#shared/schemas/id";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);
  const scheduleItemId = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const data = await readValidatedBody(event, v.parser(schema));

  return prisma.scheduleItem.update({where: {id: scheduleItemId}, data});
});
