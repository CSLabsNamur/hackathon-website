export function formatDateRange(
  start: string | number | Date,
  end: string | number | Date,
  utc?: boolean,
  capitalize?: boolean,
): string {
  const dayjs = useDayjs();

  utc = utc ?? true;
  capitalize = capitalize ?? true;

  const startDate = utc ? dayjs.utc(start) : dayjs(start);
  const endDate = utc ? dayjs.utc(end) : dayjs(end);

  if (startDate.isSame(endDate, "month")) {
    return (capitalize ? "D" : "d") + `u ${startDate.format("D")} au ${endDate.format("D MMMM YYYY")}`;
  }
  if (startDate.isSame(endDate, "year")) {
    return (capitalize ? "D" : "d") + `u ${startDate.format("D MMMM")} au ${endDate.format("D MMMM YYYY")}`;
  }
  return (capitalize ? "D" : "d") + `u ${startDate.format("D MMMM YYYY")} au ${endDate.format("D MMMM YYYY")}`;
}
