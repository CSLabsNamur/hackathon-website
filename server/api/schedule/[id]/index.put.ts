import schema from "#shared/schemas/schedule/edit";
import * as v from "valibot";
import idParamSchema from "#shared/schemas/id";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "schedule.update");
  const {id: scheduleItemId} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const body = await readValidatedBody(event, v.parser(schema));
  const data: ScheduleItemWithDates = {
    ...body,
    startTime: dayjs.tz(body.startTime, "Europe/Brussels").toDate(),
    endTime: dayjs.tz(body.endTime, "Europe/Brussels").toDate(),
  };

  await scheduleItemCanBeSaved(data, scheduleItemId);

  return prisma.scheduleItem.update({where: {id: scheduleItemId}, data});
});
