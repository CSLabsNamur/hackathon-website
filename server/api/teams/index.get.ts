export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN | UserRole.USER);

  return prisma.team.findMany({
    include: {
      members: {
        include: {
          user: true,
        },
      }, room: true,
    },
  });
});
