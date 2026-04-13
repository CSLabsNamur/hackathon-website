export default defineEventHandler(async (_event) => {
  //await requireAuth(event, UserRole.ADMIN | UserRole.USER);

  return prisma.scheduleItem.findMany({
    orderBy: [
      {startTime: "asc"},
      {endTime: "asc"},
      {title: "asc"},
    ],
  });
});
