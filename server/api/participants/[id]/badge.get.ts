import * as v from "valibot";
import idParamSchema from "#shared/schemas/id";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);
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

  const doc = await renderParticipantsBadges([participant]);

  setHeader(event, "Content-Type", "application/pdf");
  setHeader(event, "Content-Disposition", `inline; filename="badge_${participant.id}.pdf"`);

  return doc;
});
