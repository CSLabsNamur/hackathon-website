import * as v from "valibot";
import { createError, defineEventHandler, readValidatedBody, setHeader } from "h3";
import { badgeSelectionSchema } from "../../../shared/schemas/badges/selection";
import { requirePermission } from "../../utils/ability";
import { renderGuestsBadges } from "../../utils/badges";
import prisma from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "badges.print");
  await requirePermission(event, "guests.read");
  const {ids} = await readValidatedBody(event, v.parser(badgeSelectionSchema));

  const guests = await prisma.guest.findMany({
    where: {id: {in: ids}},
    orderBy: [{name: "asc"}, {id: "asc"}],
  });
  if (guests.length !== ids.length) {
    throw createError({statusCode: 404, statusMessage: "Certains invités n'existent plus. Rechargez la liste."});
  }

  const doc = await renderGuestsBadges(guests);
  setHeader(event, "Content-Type", "application/pdf");
  setHeader(event, "Content-Disposition", "attachment; filename=\"badges-guests.pdf\"");
  return doc;
});
