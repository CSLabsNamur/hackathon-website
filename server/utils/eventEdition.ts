import { createError } from "h3";
import type { Prisma } from "../prisma/generated/prisma/client";
import { EVENT_SETTINGS_ID } from "../../shared/utils/settings";
import prisma from "./prisma";

export async function getCurrentEditionId() {
  const event = await prisma.eventSettings.findUniqueOrThrow({where: {id: EVENT_SETTINGS_ID}, select: {editionId: true}});
  return event.editionId;
}

// Use after an upload or other external work, so an old request cannot save into the next edition.
// Only database operations belong in the callback.
export async function withEventTransaction<T>(editionId: string, save: (db: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(async (db) => {
    const current = await db.eventSettings.updateMany({where: {id: EVENT_SETTINGS_ID, editionId}, data: {updatedAt: new Date()}});
    if (!current.count) {
      throw createError({statusCode: 409, statusMessage: "L'édition a changé. Rechargez la page."});
    }
    if (await db.supabaseCleanupJob.count({where: {scope: "ROLLOVER"}})) {
      throw createError({statusCode: 503, statusMessage: "Terminez le nettoyage de l'édition précédente."});
    }
    return save(db);
  });
}
