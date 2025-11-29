export default defineEventHandler(async (event) => {
  //await requireAuth(event, UserRole.ADMIN);

  return prisma.participant.findMany({
    include: {
      team: {include: {members: true}},
      submissions: {include: {request: true}},
    },
  });
});
