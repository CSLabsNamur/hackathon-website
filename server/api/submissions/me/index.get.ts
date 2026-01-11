export default defineEventHandler(async (event) => {
  const user = await requireAuth(event, UserRole.USER);

  const dbUser = await getDbUser(user);

  return prisma.participant.findUnique({
    where: {userId: dbUser.id},
    include: {
      submissions: {include: {files: true, request: true}},
    },
  });
});
