import idParamSchema from "#shared/schemas/id";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "schedule.update");

  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const scheduleItem = await prisma.scheduleItem.findUnique({where: {id}});
  if (!scheduleItem) {
    throw createError({statusCode: 404, statusMessage: "Partie de planning introuvable"});
  }

  return prisma.scheduleItem.delete({where: {id}});
});
