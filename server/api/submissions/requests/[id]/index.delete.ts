export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  const id = getRouterParam(event, "id");

  return prisma.submissionRequest.delete({where: {id}});
});
