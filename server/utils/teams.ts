import { createError } from "h3";
import type { EditTeamSchema } from "../../shared/schemas/teams/edit";
import type { Prisma } from "../prisma/generated/prisma/client";
import { getCurrentEditionId, withEventTransaction } from "./eventEdition";

async function getCaptainTeam(db: Prisma.TransactionClient, userId: string, requestedTeamId?: string) {
  const participant = await db.participant.findUnique({
    where: {userId},
    select: {id: true, teamId: true},
  });
  const id = requestedTeamId ?? participant?.teamId;
  if (!participant || !id) {
    throw createError({statusCode: 404, statusMessage: "Équipe introuvable."});
  }

  const team = await db.team.findUnique({where: {id}, select: {id: true, captainId: true}});
  if (!team) {
    throw createError({statusCode: 404, statusMessage: "Équipe introuvable."});
  }
  if (team.captainId !== participant.id) {
    throw createError({statusCode: 403, statusMessage: "Cette action est réservée au capitaine de l'équipe."});
  }
  return team;
}

export async function updateOwnTeam(userId: string, data: EditTeamSchema) {
  const editionId = await getCurrentEditionId();
  return withEventTransaction(editionId, async (db) => {
    const {id, captainId} = await getCaptainTeam(db, userId);
    return db.team.update({where: {id, captainId}, data});
  });
}

export async function removeOwnTeamMember(userId: string, teamId: string, memberId: string) {
  const editionId = await getCurrentEditionId();
  await withEventTransaction(editionId, async (db) => {
    const {id, captainId} = await getCaptainTeam(db, userId, teamId);
    if (memberId === captainId) {
      throw createError({statusCode: 409, statusMessage: "Le capitaine ne peut pas être retiré de l'équipe."});
    }

    const {count} = await db.participant.updateMany({
      where: {id: memberId, teamId: id, team: {captainId}},
      data: {teamId: null},
    });
    if (!count) {
      throw createError({statusCode: 404, statusMessage: "Ce participant ne fait pas partie de l'équipe."});
    }
  });
}

export async function disbandOwnTeam(userId: string, teamId: string) {
  const editionId = await getCurrentEditionId();
  await withEventTransaction(editionId, async (db) => {
    const {id, captainId} = await getCaptainTeam(db, userId, teamId);
    const {count} = await db.team.deleteMany({
      where: {id, captainId, members: {none: {id: {not: captainId}}}},
    });
    if (!count) {
      throw createError({statusCode: 409, statusMessage: "D'autres membres font encore partie de l'équipe."});
    }
  });
}

export async function joinTeam(userId: string, token: string) {
  const editionId = await getCurrentEditionId();
  return withEventTransaction(editionId, async (db) => {
    const team = await db.team.findUnique({where: {token}, select: {id: true}});
    if (!team) {
      throw createError({statusCode: 404, statusMessage: "Équipe introuvable."});
    }

    const {count} = await db.participant.updateMany({
      where: {userId, teamId: null},
      data: {teamId: team.id},
    });
    if (!count) {
      throw createError({statusCode: 400, statusMessage: "Vous êtes déjà dans une équipe."});
    }
    return team;
  });
}
