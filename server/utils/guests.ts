import { createError } from "h3";
import { GUESTS_BUCKET } from "../../shared/utils/guestsFiles";
import prisma from "./prisma";

export async function deleteGuestWithCleanup(id: string) {
  return prisma.$transaction(async (db) => {
    const guest = await db.guest.findUnique({where: {id}});
    if (!guest) {
      throw createError({statusCode: 404, statusMessage: "Invité introuvable."});
    }

    if (guest.imageUrl) {
      await db.supabaseCleanupJob.create({data: {type: "STORAGE_OBJECT", bucket: GUESTS_BUCKET, target: guest.imageUrl}});
    }
    return db.guest.delete({where: {id}});
  }, {isolationLevel: "Serializable"}).catch((error: unknown) => {
    if (error && typeof error === "object" && "code" in error && error.code === "P2034") {
      throw createError({statusCode: 409, statusMessage: "Les données ont changé. Rechargez la page et réessayez."});
    }
    throw error;
  });
}
