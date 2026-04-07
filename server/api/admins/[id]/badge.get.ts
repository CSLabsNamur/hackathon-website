import * as v from "valibot";
import idParamSchema from "#shared/schemas/id";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "badges.print");
  await requirePermission(event, "admins.read");
  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const admin = await prisma.admin.findUnique({
    where: {id},
    include: {
      user: true,
    },
  });
  if (!admin) {
    throw createError({statusCode: 404, statusMessage: "Admin not found"});
  }

  const doc = await renderAdminBadge(admin);

  const filename = sanitizeFilename(`badge_${admin.user.firstName}_${admin.user.lastName}.pdf`);

  setHeader(event, "Content-Type", "application/pdf");
  setHeader(event, "Content-Disposition", `inline; filename="${filename}"`);

  return doc;
});
