import schema from "#shared/schemas/schedule/edit";
import * as v from "valibot";
import idParamSchema from "#shared/schemas/id";
import { assertScheduleItemCanBeSaved } from "#server/utils/scheduleItems";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "schedule.update");
  const {id: scheduleItemId} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const data = await readValidatedBody(event, v.parser(schema));

  await assertScheduleItemCanBeSaved(data, scheduleItemId);

  return prisma.scheduleItem.update({where: {id: scheduleItemId}, data});
});
