import { createError } from "h3";
import type { Prisma } from "../prisma/generated/prisma/client";
import prisma from "./prisma";

export async function deleteParticipantWithCleanup(id: string, canDeletePaidCaution: boolean) {
  return prisma.$transaction(async (db) => {
    const participant = await db.participant.findUnique({
      where: {id},
      include: {user: true, submissions: {include: {files: true}}},
    });

    if (!participant) {
      throw createError({statusCode: 404, statusMessage: "Participant introuvable."});
    }

    if (participant.caution === "PAID" && !canDeletePaidCaution) {
      throw createError({
        statusCode: 403,
        statusMessage: "Impossible de supprimer un participant dont la caution est payée sans le rôle super administrateur.",
      });
    }

    if (!participant.user.supabaseAuthId) {
      throw createError({
        statusCode: 500,
        statusMessage: "Le compte d'authentification du participant n'est pas lié correctement.",
      });
    }

    const cleanup: Prisma.SupabaseCleanupJobCreateManyInput[] = [
      {type: "AUTH_USER", target: participant.user.supabaseAuthId},
    ];
    if (participant.curriculumVitae) {
      cleanup.push({type: "STORAGE_OBJECT", bucket: "cvs", target: participant.curriculumVitae});
    }
    for (const submission of participant.submissions) {
      for (const file of submission.files) {
        cleanup.push({type: "STORAGE_OBJECT", bucket: file.bucket, target: file.path});
      }
    }

    // Commit the deletion and its retryable external cleanup together.
    await db.supabaseCleanupJob.createMany({data: cleanup});
    await db.submission.deleteMany({where: {participantId: participant.id}});
    await db.user.delete({where: {id: participant.userId}});

    return participant.user.supabaseAuthId;
  }, {isolationLevel: "Serializable"}).catch((error: unknown) => {
    if (error && typeof error === "object" && "code" in error && error.code === "P2034") {
      throw createError({
        statusCode: 409,
        statusMessage: "Les données ont changé. Rechargez la liste des participants et réessayez.",
      });
    }
    throw error;
  });
}
