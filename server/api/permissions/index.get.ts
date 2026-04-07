export default defineEventHandler(async (event) => {
  await requirePermission(event, "roles.read");

  return prisma.permission.findMany({
    orderBy: [
      {group: "asc"},
      {key: "asc"},
    ],
  });
});
