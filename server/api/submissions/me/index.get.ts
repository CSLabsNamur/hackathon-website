export default defineEventHandler(async (event) => {
  const user = await requireAuth(event, UserRole.USER);

  return prisma.participant.findUnique({where: {id: user.sub}}).submissions();
});
