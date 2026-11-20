import { createError } from "h3";
import prisma from "./prisma";
import dayjs from "./dayjs";
import { withEventTransaction } from "./eventEdition";
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

export type SubmissionActor = Prisma.ParticipantGetPayload<{
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

export const getSubmissionActor = async (userId: string, db: Pick<Prisma.TransactionClient, "participant"> = prisma): Promise<SubmissionActor> => {
  try {
    return await db.participant.findUniqueOrThrow({
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

export async function findAccessibleSubmission(params: FindAccessibleSubmissionParams, db: Pick<Prisma.TransactionClient, "submission"> = prisma) {
  const {requestId, participantIds} = params;

  const submissions = await db.submission.findMany({
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
}

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

type SubmissionTransactionContext = {
  editionId: string;
  userId: string;
  request: Prisma.SubmissionRequestGetPayload<object>;
  teamId: string | null;
  expectedUpdatedAt?: string | null;
  expectedTeamId?: string | null;
};

type AccessibleSubmission = Prisma.SubmissionGetPayload<{ include: typeof accessibleSubmissionInclude }>;
type SubmissionMutation = (db: Prisma.TransactionClient, existing: AccessibleSubmission | null, actor: SubmissionActor) => Promise<AccessibleSubmission | null>;

export async function withSubmissionTransaction(context: SubmissionTransactionContext, mutate: SubmissionMutation) {
  return withEventTransaction(context.editionId, async (db) => {
    const request = await db.submissionRequest.findUnique({where: {id: context.request.id}});
    if (!request || request.updatedAt.getTime() !== context.request.updatedAt.getTime()) {
      throw createError({statusCode: 409, statusMessage: "Cette demande a changé. Rechargez-la avant de continuer."});
    }
    if (dayjs().isAfter(dayjs(request.deadline))) {
      throw createError({statusCode: 403, statusMessage: "La date limite de soumission est dépassée."});
    }

    const actor = await getSubmissionActor(context.userId, db);
    if (request.teamRequest && (!actor.team || actor.team.id !== context.teamId || (context.expectedTeamId !== undefined && actor.team.id !== context.expectedTeamId))) {
      throw createError({statusCode: 409, statusMessage: "Votre équipe a changé. Rechargez la page."});
    }
    const existing = await findAccessibleSubmission({
      requestId: request.id,
      participantIds: request.teamRequest ? actor.team!.members.map((member) => member.id) : [actor.id],
    }, db);
    if (context.expectedUpdatedAt !== undefined && (existing?.updatedAt.toISOString() ?? null) !== context.expectedUpdatedAt) {
      throw createError({
        statusCode: 409,
        statusMessage: "Une autre réponse a été enregistrée. Rechargez-la avant de continuer.",
      });
    }

    return mutate(db, existing, actor);
  });
}

export async function queueSubmissionFilesCleanup(db: Prisma.TransactionClient, files: {
  bucket: string;
  path: string
}[]) {
  if (!files.length) return;
  await db.supabaseCleanupJob.createMany({
    data: files.map((file) => ({
      type: "STORAGE_OBJECT",
      bucket: file.bucket,
      target: file.path,
    })),
  });
}
