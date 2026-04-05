export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "submissions.read.own");

  return prisma.participant.findUnique({
    where: {userId: dbUser.id},
    include: {
      submissions: {include: {files: true, request: true}},
    },
  });
});
