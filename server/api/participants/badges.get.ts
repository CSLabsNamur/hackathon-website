export default defineEventHandler(async (event) => {
  await requirePermission(event, "badges.print");
  await requirePermission(event, "participants.read");

  const participants = await prisma.participant.findMany({
    include: {
      user: true,
      team: true,
    },
  });
  if (!participants) {
    throw createError({statusCode: 404, statusMessage: "Participant not found"});
  }

  const doc = await renderParticipantsBadges(participants);

  setHeader(event, "Content-Type", "application/pdf");
  setHeader(event, "Content-Disposition", `inline; filename="badges.pdf"`);

  return doc;
});
