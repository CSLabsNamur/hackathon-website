import type { DbUser } from "../../shared/utils/types";

export const getParticipantForDbUser = async (dbUser: DbUser) => {
  try {
    return await prisma.participant.findUniqueOrThrow({
      where: {userId: dbUser.id},
      select: {
        id: true,
        userId: true,
        team: {
          select: {
            id: true,
          },
        },
      },
    });
  } catch {
    throw createError({statusCode: 404, statusMessage: "Participant introuvable"});
  }
};
