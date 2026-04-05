export default defineEventHandler(async (event) => {
  const user = await requireAuth(event, UserRole.ADMIN);

  const dbUser = await getDbUser(user);

  return prisma.admin.findUnique({
    where: {userId: dbUser.id},
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
