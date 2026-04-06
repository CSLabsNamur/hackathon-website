import type { DbUser } from "../../shared/utils/types";

export const getParticipantForDbUser = async (dbUser: DbUser) => {
  try {
    return await prisma.participant.findUniqueOrThrow({
      where: {userId: dbUser.id},
      include: {
        team: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
        submissions: {
          include: {
            request: true,
          },
        },
        user: true,
      },
    });
  } catch {
    throw createError({statusCode: 404, statusMessage: "Participant introuvable"});
  }
};
