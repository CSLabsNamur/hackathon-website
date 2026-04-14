import type { Prisma } from "~~/server/prisma/generated/prisma/client";

export const accessibleSubmissionInclude: Readonly<Prisma.SubmissionInclude> = {
  request: true,
  files: true,
  participant: {
    select: {
      id: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  },
};

type SubmissionActor = Prisma.ParticipantGetPayload<{
  select: {
    id: true;
    team: {
      select: {
        id: true;
        members: {
          select: {
            id: true;
          };
        };
      };
    };
  };
}>;

export const getSubmissionActor = async (userId: string): Promise<SubmissionActor> => {
  try {
    return await prisma.participant.findUniqueOrThrow({
      where: {userId},
      select: {
        id: true,
        team: {
          select: {
            id: true,
            members: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });
  } catch {
    throw createError({statusCode: 404, statusMessage: "Participant introuvable"});
  }
};

type FindAccessibleSubmissionParams = {
  requestId: string;
  participantIds: string[];
};
export const findAccessibleSubmission = async ({requestId, participantIds}: FindAccessibleSubmissionParams) => {
  const submissions = await prisma.submission.findMany({
    where: {
      requestId,
      participantId: {in: participantIds},
    },
    include: accessibleSubmissionInclude,
    orderBy: [
      {updatedAt: "desc"},
      {createdAt: "desc"},
    ],
  });

  return submissions[0] ?? null;
};

export const getAccessibleSubmissionsForParticipant = async (participant: SubmissionActor) => {
  const submissions = await prisma.submission.findMany({
    where: participant.team
      ? {
        OR: [
          {
            participantId: participant.id,
            request: {
              teamRequest: false,
            },
          },
          {
            participantId: {
              in: participant.team.members.map((member) => member.id),
            },
            request: {
              teamRequest: true,
            },
          },
        ],
      }
      : {
        participantId: participant.id,
        request: {
          teamRequest: false,
        },
      },
    include: accessibleSubmissionInclude,
    orderBy: [
      {updatedAt: "desc"},
      {createdAt: "desc"},
    ],
  });

  const submissionsByRequest = new Map<string, (typeof submissions)[number]>();
  for (const submission of submissions) {
    if (!submissionsByRequest.has(submission.requestId)) {
      submissionsByRequest.set(submission.requestId, submission);
    }
  }

  return [...submissionsByRequest.values()];
};
