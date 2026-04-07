export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "teams.read.own");

  return prisma.participant.findUnique({where: {userId: dbUser.id}}).team({
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });
});
