import * as v from "valibot";
import idParamSchema from "#shared/schemas/id";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "badges.print");
  await requirePermission(event, "sponsors.read");
  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const sponsor = await prisma.sponsor.findUnique({
    where: {
      id,
      hasBadge: true,
    },
  });
  if (!sponsor) {
    throw createError({statusCode: 404, statusMessage: "Sponsor not found"});
  }

  const doc = await renderSponsorBadge(sponsor);

  const filename = sanitizeFilename(`sponsor_${sponsor.name}.pdf`);

  setHeader(event, "Content-Type", "application/pdf");
  setHeader(event, "Content-Disposition", `inline; filename="${filename}"`);

  return doc;
});
