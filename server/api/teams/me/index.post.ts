import schema from "#shared/schemas/teams/create";
import * as v from "valibot";
import type { Prisma } from "~~/server/prisma/generated/prisma/browser";

/**
 * Create a new team and associate the current user as a member.
 */
export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "teams.create.own");

  const data = await readValidatedBody(event, v.parser(schema));

  const payload: Prisma.TeamCreateInput = data;

  return prisma.$transaction(async (tx) => {
    const team = await tx.team.create({data: payload});
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
