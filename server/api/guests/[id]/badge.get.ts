import * as v from "valibot";
import idParamSchema from "#shared/schemas/id";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);
  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const guest = await prisma.guest.findUnique({
    where: {id},
  });
  if (!guest) {
    throw createError({statusCode: 404, statusMessage: "Guest not found"});
  }

  const doc = await renderGuestBadge(guest);

  const filename = sanitizeFilename(`badge_${guest.name}.pdf`);

  setHeader(event, "Content-Type", "application/pdf");
  setHeader(event, "Content-Disposition", `inline; filename="${filename}"`);

  return doc;
});
