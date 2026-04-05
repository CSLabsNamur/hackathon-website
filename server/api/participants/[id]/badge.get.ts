import * as v from "valibot";
import idParamSchema from "#shared/schemas/id";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "badges.print");
  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const participant = await prisma.participant.findUnique({
    where: {id},
    include: {
      user: true,
      team: true,
    },
  });
  if (!participant) {
    throw createError({statusCode: 404, statusMessage: "Participant not found"});
  }

  const doc = await renderParticipantBadge(participant);

  const filename = sanitizeFilename(`badge_${participant.user.firstName}_${participant.user.lastName}.pdf`);

  setHeader(event, "Content-Type", "application/pdf");
  setHeader(event, "Content-Disposition", `inline; filename="${filename}"`);

  return doc;
});
