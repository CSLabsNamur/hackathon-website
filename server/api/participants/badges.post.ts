import * as v from "valibot";
import { createError, defineEventHandler, readValidatedBody, setHeader } from "h3";
import { badgeSelectionSchema } from "../../../shared/schemas/badges/selection";
import { requirePermission } from "../../utils/ability";
import { renderParticipantsBadges } from "../../utils/badges";
import prisma from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "badges.print");
  await requirePermission(event, "participants.read");
  const {ids} = await readValidatedBody(event, v.parser(badgeSelectionSchema));

  const participants = await prisma.participant.findMany({
    where: {id: {in: ids}},
    include: {user: true, team: true},
    orderBy: [{user: {lastName: "asc"}}, {user: {firstName: "asc"}}, {id: "asc"}],
  });
  if (participants.length !== ids.length) {
    throw createError({statusCode: 404, statusMessage: "Certains participants n'existent plus. Rechargez la liste."});
  }

  const doc = await renderParticipantsBadges(participants, event);
  setHeader(event, "Content-Type", "application/pdf");
  setHeader(event, "Content-Disposition", "attachment; filename=\"badges-participants.pdf\"");
  return doc;
});
