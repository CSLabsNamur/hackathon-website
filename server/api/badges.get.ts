import * as v from "valibot";
import renderBadgesQuerySchema from "#shared/schemas/badges/render";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  const {
    participants: includeParticipants = true,
    guests: includeGuests = true,
    sponsors: includeSponsors = true,
  } = await getValidatedQuery(event, v.parser(renderBadgesQuerySchema));

  if (!includeParticipants && !includeGuests && !includeSponsors) {
    throw createError({
      statusCode: 400,
      statusMessage: "Aucun type de badge sélectionné.",
    });
  }

  const [participants, guests, sponsors] = await Promise.all([
    includeParticipants
      ? prisma.participant.findMany({
        include: {
          user: true,
          team: true,
        },
      })
      : [],
    includeGuests
      ? prisma.guest.findMany({
        orderBy: {
          name: "asc",
        },
      })
      : [],
    includeSponsors
      ? prisma.sponsor.findMany({
        where: {
          hasBadge: true,
        },
        orderBy: {
          name: "asc",
        },
      })
      : [],
  ]);

  const doc = await renderAllBadges(
    includeParticipants ? participants : [],
    includeGuests ? guests : [],
    includeSponsors ? sponsors : [],
  );

  setHeader(event, "Content-Type", "application/pdf");
  setHeader(event, "Content-Disposition", "inline; filename=\"badges.pdf\"");

  return doc;
});
