export default defineEventHandler(async (event) => {
  await requirePermission(event, "admins.read");

  return prisma.admin.findMany({
    include: {
      user: {
        include: {
          roleAssignments: {
            include: {
              role: true,
            },
          },
        },
      },
    },
  });
});
