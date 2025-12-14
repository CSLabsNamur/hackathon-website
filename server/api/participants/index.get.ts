export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  return prisma.participant.findMany({
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
