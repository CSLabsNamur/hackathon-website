export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

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
