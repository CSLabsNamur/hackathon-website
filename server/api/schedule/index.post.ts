import schema from "#shared/schemas/schedule/create";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "schedule.update");
  const editionId = await getCurrentEditionId();

  const body = await readValidatedBody(event, v.parser(schema));
  const data: ScheduleItemWithDates = {
    ...body,
    startTime: dayjs.tz(body.startTime, "Europe/Brussels").toDate(),
    endTime: dayjs.tz(body.endTime, "Europe/Brussels").toDate(),
  };

  await scheduleItemCanBeSaved(data);

  return withEventTransaction(editionId, (db) => db.scheduleItem.create({data}));
});
