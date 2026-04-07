import * as v from "valibot";
import schema from "#shared/schemas/teams/join";

/**
 * Join a team as the current user.
 */
export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "teams.join");

  const data = await readValidatedBody(event, v.parser(schema));

  return prisma.$transaction(async (tx) => {
    const team = await tx.team.findUnique({
      where: {token: data.token},
      select: {
        id: true,
      },
    });

    if (!team) {
      throw createError({
        statusCode: 404,
        statusMessage: "Équipe introuvable.",
      });
    }

    const updateResult = await tx.participant.updateMany({
      where: {
        userId: dbUser.id,
        teamId: null,
      },
      data: {
        teamId: team.id,
      },
    });

    if (updateResult.count !== 1) {
      throw createError({
        statusCode: 400,
        statusMessage: "Vous êtes déjà dans une équipe.",
      });
    }

    return team;
  });
});
