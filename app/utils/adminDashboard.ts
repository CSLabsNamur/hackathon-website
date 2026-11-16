type Registration = { createdAt: string };
type Caution = { caution: string };
type TeamSize = { members: unknown[] };

export function getRegistrationTimeline(participants: Registration[], days: number, now = new Date()) {
  const dayjs = useDayjs();
  const current = dayjs(now).tz();
  const today = current.startOf("day");

  const dates = participants
    .map(participant => dayjs(participant.createdAt).tz())
    .filter(date => date.isValid() && !date.isAfter(current));
  if (!dates.length) return {data: [], total: 0, weekly: false};

  const firstRegistration = dates.reduce((earliest, date) => date.isBefore(earliest) ? date : earliest);
  const start = (days > 0 ? today.subtract(days - 1, "day") : firstRegistration).startOf("day");
  const weekly = today.diff(start, "day") >= 90;
  const unit = weekly ? "week" : "day";
  const counts = new Map<string, number>();

  for (const date of dates) {
    if (date.isBefore(start, "day")) continue;
    const bucket = date.startOf(unit).format("YYYY-MM-DD");
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }

  const data = [];
  for (let date = start.startOf(unit); !date.isAfter(today, "day"); date = date.add(1, unit).startOf(unit)) {
    data.push({date: formatDate(date.toDate(), "D MMM YY"), count: counts.get(date.format("YYYY-MM-DD")) ?? 0});
  }

  return {data, total: data.reduce((sum, row) => sum + row.count, 0), weekly};
}

export function getCautionBreakdown(participants: Caution[]) {
  return ([
    {status: "PAID", color: "success"},
    {status: "NOT_PAID", color: "warning"},
    {status: "REFUNDED", color: "info"},
    {status: "WAIVED", color: "neutral"},
  ] as const).map(item => ({
    ...item,
    label: cautionStatusTranslateMap[item.status],
    count: participants.filter(participant => participant.caution === item.status).length,
  }));
}

export function getTeamSizeDistribution(teams: TeamSize[]) {
  const counts = new Map<number, number>();
  for (const team of teams) {
    counts.set(team.members.length, (counts.get(team.members.length) ?? 0) + 1);
  }
  return Array.from(counts, ([size, count]) => ({size, label: `${size} membre${size > 1 ? "s" : ""}`, count}))
    .sort((a, b) => a.size - b.size);
}
