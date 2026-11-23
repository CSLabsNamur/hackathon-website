export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "teams.read.own");

  return prisma.participant.findUnique({where: {userId: dbUser.id}}).team({
    select: {
      id: true,
      name: true,
      description: true,
      captainId: true,
      token: true,
      room: {
        select: {
          name: true,
        },
      },
      members: {
        select: {
          id: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });
});
