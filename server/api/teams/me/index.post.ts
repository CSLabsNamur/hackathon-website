import schema from "#shared/schemas/teams/create";
import * as v from "valibot";
import type { Prisma } from "~~/server/prisma/generated/prisma/browser";

/**
 * Create a new team and associate the current user as a member.
 */
export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "teams.create.own");

  const data = await readValidatedBody(event, v.parser(schema));

  // Ensure the user is not already in a team
  const existingTeam = await prisma.team.findFirst({
    where: {
      members: {
        some: {
          userId: dbUser.id,
        },
      },
    },
  });

  if (existingTeam) {
    throw createError({
      statusCode: 400,
      statusMessage: "Vous êtes déjà dans une équipe.",
    });
  }

  const payload: Prisma.TeamCreateInput = {
    ...data,
    members: {
      connect: {
        userId: dbUser.id,
      },
    },
  };

  return prisma.team.create({data: payload});
});
