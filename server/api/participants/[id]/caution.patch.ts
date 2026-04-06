import schema from "#shared/schemas/participants/caution";
import * as v from "valibot";
import idParamSchema from "#shared/schemas/id";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "participants.update");
  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const data = await readValidatedBody(event, v.parser(schema));

  const participant = await prisma.participant.findUnique({where: {id}});
  if (!participant) {
    throw createError({statusCode: 404, message: "Participant introuvable."});
  }

  if (isSuperAdmin(dbUser)) {
    return prisma.participant.update({where: {id}, data});
  } else {
    // NOT_PAID -> PAID/WAIVED, PAID -> REFUNDED, WAIVED -> NOT_PAID, REFUNDED -> PAID. Any other transition is forbidden for non-super-admins.
    const canUpdateCaution =
      (participant.caution === "NOT_PAID" && (data.caution === "PAID" || data.caution === "WAIVED")) ||
      (participant.caution === "PAID" && data.caution === "REFUNDED") ||
      (participant.caution === "WAIVED" && data.caution === "NOT_PAID") ||
      (participant.caution === "REFUNDED" && data.caution === "PAID");

    if (canUpdateCaution) {
      return prisma.participant.update({where: {id}, data});
    } else {
      throw createError({statusCode: 403, message: "Transition de statut de caution interdite."});
    }
  }
});
