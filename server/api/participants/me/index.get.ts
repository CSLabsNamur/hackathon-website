export default defineEventHandler(async (event) => {
  //const user = await requireAuth(event, UserRole.USER);

  //return prisma.participant.findUnique({where: {id: user.sub}}).team().members();

  await new Promise((resolve) => setTimeout(resolve, 2000));
  const participants = await prisma.participant.findMany({
    include: {
      team: {
        include: {
          members: true,
        },
      },
      submissions: true,
    },
  });
  return participants[0];
});
