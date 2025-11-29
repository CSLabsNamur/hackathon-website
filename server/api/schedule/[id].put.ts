import schema from "#shared/schemas/schedule/edit";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);
  const scheduleItemId = getRouterParam(event, "id");

  const data = await readValidatedBody(event, v.parser(schema));

  return prisma.scheduleItem.update({where: {id: scheduleItemId}, data});
});
