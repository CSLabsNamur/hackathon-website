export default defineEventHandler(async (event) => {
  const user = await requireAuth(event, UserRole.ADMIN);

  //return prisma.participant.findUnique({where: {id: user.sub}}).team().members();

  await new Promise((resolve) => setTimeout(resolve, 2000));
  const admins = await prisma.admin.findMany({
    include: {
      user: true,
    },
  });
  return admins[0];
});
