export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

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
