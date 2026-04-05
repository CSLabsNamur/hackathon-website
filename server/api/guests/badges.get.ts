export default defineEventHandler(async (event) => {
  await requirePermission(event, "badges.print");

  const guests = await prisma.guest.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const doc = await renderGuestsBadges(guests);

  setHeader(event, "Content-Type", "application/pdf");
  setHeader(event, "Content-Disposition", "inline; filename=\"badges_invites.pdf\"");

  return doc;
});
