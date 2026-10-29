export default defineEventHandler(async (event) => {
  await requirePermission(event, "settings.read");
  return prisma.eventArchive.findMany({
    select: {id: true, title: true, startDate: true, endDate: true, archivedAt: true},
    orderBy: {startDate: "desc"},
  });
});
