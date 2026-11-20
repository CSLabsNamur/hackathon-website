export default defineEventHandler(async (event) => {
  await requirePermission(event, "submissionRequests.read");

  const requests = await prisma.submissionRequest.findMany({include: {_count: {select: {submissions: true}}}});
  return requests.map((request) => ({...request, submissions: []}));
});
