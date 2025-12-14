export default defineEventHandler(async (event) => {
  const user = await requireAuth(event, UserRole.USER);

  const dbUser = await getDbUser(user);

  return prisma.participant.findUnique({
    where: {userId: dbUser.id},
    include: {
      team: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      },
      submissions: {
        include: {
          request: true,
        },
      },
      user: true,
    },
  });
});
