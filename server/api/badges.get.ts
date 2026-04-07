import * as v from "valibot";
import renderBadgesQuerySchema from "#shared/schemas/badges/render";

export default defineEventHandler(async (event) => {
  const context = await requirePermission(event, "badges.print");

  const {
    participants: includeParticipants = true,
    guests: includeGuests = true,
    sponsors: includeSponsors = true,
    admins: includeAdmins = true,
  } = await getValidatedQuery(event, v.parser(renderBadgesQuerySchema));

  if (!includeParticipants && !includeGuests && !includeSponsors && !includeAdmins) {
    throw createError({
      statusCode: 400,
      statusMessage: "Aucun type de badge sélectionné.",
    });
  }

  const readPermissionChecks = [
    [includeParticipants, "participants.read"],
    [includeGuests, "guests.read"],
    [includeSponsors, "sponsors.read"],
    [includeAdmins, "admins.read"],
  ] as const;

  for (const [shouldInclude, permission] of readPermissionChecks) {
    if (shouldInclude && !canUsePermission(context.ability, permission)) {
      throw createError({statusCode: 403, statusMessage: "Forbidden"});
    }
  }

  const [participants, guests, sponsors, admins] = await Promise.all([
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
    includeAdmins
      ? prisma.admin.findMany({
        include: {
          user: true,
        },
      })
      : [],
  ]);

  const doc = await renderAllBadges(
    includeParticipants ? participants : [],
    includeGuests ? guests : [],
    includeSponsors ? sponsors : [],
    includeAdmins ? admins : [],
  );

  setHeader(event, "Content-Type", "application/pdf");
  setHeader(event, "Content-Disposition", "inline; filename=\"badges.pdf\"");

  return doc;
});
