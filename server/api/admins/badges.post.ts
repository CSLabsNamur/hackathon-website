import * as v from "valibot";
import { createError, defineEventHandler, readValidatedBody, setHeader } from "h3";
import { adminBadgeSelectionSchema } from "../../../shared/schemas/admins/badges";
import { requirePermission } from "../../utils/ability";
import { renderAdminsBadges } from "../../utils/badges";
import prisma from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "badges.print");
  await requirePermission(event, "admins.read");
  const {ids} = await readValidatedBody(event, v.parser(adminBadgeSelectionSchema));

  const admins = await prisma.admin.findMany({
    where: {id: {in: ids}},
    include: {user: true},
    orderBy: [{user: {lastName: "asc"}}, {user: {firstName: "asc"}}, {id: "asc"}],
  });
  if (admins.length !== ids.length) {
    throw createError({statusCode: 404, statusMessage: "Certains administrateurs n'existent plus. Rechargez la liste."});
  }

  const doc = await renderAdminsBadges(admins);
  setHeader(event, "Content-Type", "application/pdf");
  setHeader(event, "Content-Disposition", "attachment; filename=\"badges-administrateurs.pdf\"");
  return doc;
});
