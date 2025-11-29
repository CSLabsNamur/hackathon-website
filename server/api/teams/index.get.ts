export default defineEventHandler(async (event) => {
  //await requireAuth(event, UserRole.ADMIN | UserRole.USER);

  return prisma.team.findMany({include: {members: true, room: true}});
});
