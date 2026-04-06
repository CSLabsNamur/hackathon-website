import idParamSchema from "#shared/schemas/id";
import * as v from "valibot";
import { CautionStatus } from "#server/prisma/generated/prisma/enums";
import { isSuperAdmin } from "#server/utils/ability";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "participants.delete");
  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const participant = await prisma.participant.findUnique({
    where: {
      id,
    },
    select: {
      caution: true,
    },
  });

  if (!participant) {
    throw createError({statusCode: 404, statusMessage: "Participant introuvable."});
  }

  if (participant.caution === CautionStatus.PAID && !isSuperAdmin(dbUser)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Impossible de supprimer un participant dont la caution est payée sans le rôle super administrateur.",
    });
  }

  return prisma.participant.delete({where: {id}});
});
