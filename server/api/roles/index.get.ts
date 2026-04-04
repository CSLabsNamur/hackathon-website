export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        include: {
          permission: true,
        },
        orderBy: {
          permission: {
            key: "asc",
          },
        },
      },
      _count: {
        select: {
          assignments: true,
        },
      },
    },
    orderBy: [
      {system: "desc"},
      {name: "asc"},
    ],
  });

  return roles.map((role) => ({
    ...role,
    permissions: role.permissions.map(({permission}) => permission),
  }));
});
