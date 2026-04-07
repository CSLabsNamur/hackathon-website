export default defineEventHandler(async (event) => {
  await requirePermission(event, "teams.read");

  return prisma.team.findMany({
    include: {
      members: {
        select: {
          id: true,
          caution: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      room: true,
    },
  });
});
