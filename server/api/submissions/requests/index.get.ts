export default defineEventHandler(async (event) => {
  const context = await requirePermission(event, "submissionRequests.read");

  if (canUsePermission(context.ability, "participants.read")) {
    return prisma.submissionRequest.findMany({
      include: {
        submissions: {
          include: {
            files: true,
          },
        },
      },
    });
  }

  const requests = await prisma.submissionRequest.findMany();

  return requests.map((request) => ({
    ...request,
    submissions: [],
  }));
});
