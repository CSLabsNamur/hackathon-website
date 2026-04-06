import schema from "#shared/schemas/schedule/create";
import * as v from "valibot";
import { assertScheduleItemCanBeSaved } from "#server/utils/scheduleItems";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "schedule.create");

  const data = await readValidatedBody(event, v.parser(schema));

  await assertScheduleItemCanBeSaved(data);

  return prisma.scheduleItem.create({data});
});
