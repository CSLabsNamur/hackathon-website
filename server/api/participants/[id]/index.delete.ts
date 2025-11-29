export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  const id = getRouterParam(event, "id");

  return prisma.participant.delete({where: {id}});
});
