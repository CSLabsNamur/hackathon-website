import * as v from "valibot";
import { createError, defineEventHandler, readValidatedBody, setHeader } from "h3";
import { badgeSelectionSchema } from "../../../shared/schemas/badges/selection";
import { requirePermission } from "../../utils/ability";
import { renderSponsorsBadges } from "../../utils/badges";
import prisma from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "badges.print");
  await requirePermission(event, "sponsors.read");
  const {ids} = await readValidatedBody(event, v.parser(badgeSelectionSchema));

  const sponsors = await prisma.sponsor.findMany({
    where: {id: {in: ids}},
    orderBy: [{name: "asc"}, {id: "asc"}],
  });
  if (sponsors.length !== ids.length) {
    throw createError({statusCode: 404, statusMessage: "Certains sponsors n'existent plus. Rechargez la liste."});
  }
  if (sponsors.some((sponsor) => !sponsor.hasBadge)) {
    throw createError({statusCode: 403, statusMessage: "Certains sponsors ne disposent pas de badge."});
  }

  const doc = await renderSponsorsBadges(sponsors);
  setHeader(event, "Content-Type", "application/pdf");
  setHeader(event, "Content-Disposition", "attachment; filename=\"badges-sponsors.pdf\"");
  return doc;
});
