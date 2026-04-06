import * as v from "valibot";
import schema from "#shared/schemas/teams/join";

/**
 * Join a team as the current user.
 */
export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "teams.join");

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

  return prisma.$transaction([
    // Disconnect the user from any existing team in an atomic update, just in case they were added to a team between the check and the update
    prisma.participant.update({
      where: {userId: dbUser.id},
      data: {
        team: {
          disconnect: true,
        },
      },
    }),
    prisma.team.update({
      where: {token: data.token},
      data: {
        members: {
          connect: {
            userId: dbUser.id,
          },
        },
      },
    }),
  ]);
});
