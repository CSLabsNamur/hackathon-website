export function formatDateRange(
  start: string | number | Date,
  end: string | number | Date,
  utc: boolean = true,
  capitalize: boolean = true,
): string {
  const dayjs = useDayjs();

  const startDate = utc ? dayjs.utc(start) : dayjs(start);
  const endDate = utc ? dayjs.utc(end) : dayjs(end);

  const prefix = capitalize ? "Du" : "du";

  if (startDate.isSame(endDate, "month")) {
    return `${prefix} ${startDate.format("D")} au ${endDate.format("D MMMM YYYY")}`;
  }
  if (startDate.isSame(endDate, "year")) {
    return `${prefix} ${startDate.format("D MMMM")} au ${endDate.format("D MMMM YYYY")}`;
  }
  return `${prefix} ${startDate.format("D MMMM YYYY")} au ${endDate.format("D MMMM YYYY")}`;
}
