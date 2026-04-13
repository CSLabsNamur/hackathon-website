import { capitalize } from "#shared/utils/strings";
import type { CreateScheduleItemInput } from "#shared/schemas/schedule/create";

/**
 * Formats a schedule item as a human-readable string, e.g. "Lundi 14h00 - 15h00" or "Lundi 30 Mai 14h00 → Mardi 31 Mai 16h00", depending on whether the start/end times are on the same day or not.
 *
 * @param startTime The start time of the schedule item
 * @param endTime The end time of the schedule item
 * @returns A string representing the schedule item. If the start/end times are not valid dates, returns "Choisissez un créneau horaire"
 */
export function formatScheduleRange(startTime: string | Date, endTime: string | Date) {
  const dayjs = useDayjs();

  const start = dayjs(startTime);
  const end = dayjs(endTime);
  if (!start.isValid() || !end.isValid()) {
    return "Choisissez un créneau horaire";
  }

  if (start.isSame(end, "day")) {
    return `${capitalize(start.format("dddd D MMMM"))} · ${start.format("HH[h]mm")} - ${end.format("HH[h]mm")}`;
  }

  return `${capitalize(start.format("ddd D MMM · HH[h]mm"))} → ${capitalize(end.format("ddd D MMM · HH[h]mm"))}`;
}

/**
 * A more compact version of `formatScheduleRange` used to suggest the dateString of a `ScheduleItem`, which is the human-friendly text shown on the public schedule and in the `ScheduleCard`.
 *
 * @param startTime The start time of the schedule item.
 * @param endTime The end time of the schedule item.
 * @returns A string representing the schedule item, e.g. "Lundi 14h00 - 15h00". If the start/end times are not valid dates, returns an empty string
 */
export function buildSuggestedScheduleDateString(startTime: string | Date, endTime: string | Date) {
  const dayjs = useDayjs();

  const start = dayjs(startTime);
  const end = dayjs(endTime);

  if (!start.isValid() || !end.isValid()) return "";
  if (start.isSame(end, "day")) {
    return capitalize(start.format("dddd H[h]mm"));
  }

  return `${capitalize(start.format("dddd H[h]mm"))} - ${capitalize(end.format("dddd H[h]mm"))}`;
}

/**
 * Converts a `ScheduleItem` (as stored in the database) into the shape expected by the form for creating/editing schedule items, including formatting the start/end times as `YYYY-MM-DDTHH:mm` strings for use in `datetime-local` inputs.
 *
 * @param item The `ScheduleItem` to convert
 * @returns A `CreateScheduleItemInput` with start/end times formatted as strings suitable for `datetime-local` inputs
 */
export function scheduleItemToFormState(item: ScheduleItem): CreateScheduleItemInput {
  const dayjs = useDayjs();

  // Note: datetime-local inputs expect a `YYYY-MM-DDTHH:mm` string.
  return {
    title: item.title,
    description: item.description,
    icon: item.icon ?? "i-lucide-calendar",
    dateString: item.dateString,
    startTime: dayjs(item.startTime).format("YYYY-MM-DDTHH:mm"),
    endTime: dayjs(item.endTime).format("YYYY-MM-DDTHH:mm"),
    special: item.special,
  };
}

/**
 * Creates a default form state for creating a new schedule item, optionally based on an existing "base" item (e.g. to pre-fill the form when appending a new item after an existing one) and/or an event start date (e.g. to pre-fill the form when creating the first item of a schedule).
 *
 * @param baseItem An optional existing `ScheduleItem` to use as a reference for setting the default start time of the new item (defaults to starting right after the end of the base item if provided)
 * @param eventStartDate An optional event start date to use as a reference for setting the default start time of the new item if no base item is provided (defaults to starting at the event start date if provided, or the current hour if not)
 * @returns A `CreateScheduleItemInput` with default values for creating a new schedule item, including a default title/description/icon and start/end times formatted as strings suitable for `datetime-local` inputs
 */
export function createEmptyScheduleFormState(baseItem?: ScheduleItem | null, eventStartDate?: string | Date | null): CreateScheduleItemInput {
  const dayjs = useDayjs();

  const start = baseItem
    // if a base item exists, start right after it ends (common "append" workflow)
    ? dayjs(baseItem.endTime)
    // otherwise, start at the event start date (if configured)
    : eventStartDate
      ? dayjs(eventStartDate)
      // otherwise, start at the current hour
      : dayjs().startOf("hour");
  const end = start.add(1, "hour");

  return {
    title: "",
    description: "",
    icon: baseItem?.icon ?? "i-lucide-calendar",
    dateString: capitalize(start.format("dddd H[h]mm")),
    startTime: start.format("YYYY-MM-DDTHH:mm"),
    endTime: end.format("YYYY-MM-DDTHH:mm"),
    special: false,
  };
}
