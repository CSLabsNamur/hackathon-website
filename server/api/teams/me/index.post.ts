import schema from "#shared/schemas/teams/create";
import * as v from "valibot";
import type { Prisma } from "~~/server/prisma/generated/prisma/browser";

/**
 * Create a new team and associate the current user as a member.
 */
export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "teams.create.own");
  const editionId = await getCurrentEditionId();

  const data = await readValidatedBody(event, v.parser(schema));

  return withEventTransaction(editionId, async (tx) => {
    const participant = await tx.participant.findUnique({
      where: {userId: dbUser.id},
      select: {id: true, teamId: true},
    });
    if (!participant) {
      throw createError({statusCode: 404, statusMessage: "Participant introuvable."});
    }
    if (participant.teamId) {
      throw createError({statusCode: 400, statusMessage: "Vous êtes déjà dans une équipe."});
    }

    const payload: Prisma.TeamCreateInput = {
      ...data,
      captain: {connect: {id: participant.id}},
    };
    const team = await tx.team.create({data: payload});
    const updateResult = await tx.participant.updateMany({
      where: {
        id: participant.id,
        teamId: null,
      },
      data: {
        teamId: team.id,
      },
    });

    if (updateResult.count !== 1) {
      throw createError({statusCode: 400, statusMessage: "Vous êtes déjà dans une équipe."});
    }

    return team;
  });
});
