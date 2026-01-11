export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN | UserRole.USER);

  return prisma.submissionRequest.findMany({include: {submissions: {include: {files: true}}}});
});
