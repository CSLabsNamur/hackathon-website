export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  return prisma.permission.findMany({
    orderBy: [
      { group: "asc" },
      { key: "asc" },
    ],
  });
});
