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
          // TODO: Urgently check for unnecessary data exposure. Not critical now as only admins can access this endpoint, but still.
          files: true,
        },
      },
      user: true,
    },
  });
});
