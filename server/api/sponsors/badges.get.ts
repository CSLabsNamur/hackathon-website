export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  const sponsors = await prisma.sponsor.findMany({
    where: {
      hasBadge: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const doc = await renderSponsorsBadges(sponsors);

  setHeader(event, "Content-Type", "application/pdf");
  setHeader(event, "Content-Disposition", "inline; filename=\"badges_sponsors.pdf\"");

  return doc;
});
