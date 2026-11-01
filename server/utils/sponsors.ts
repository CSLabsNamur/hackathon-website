import { createError } from "h3";
import { SPONSORS_BUCKET } from "../../shared/utils/sponsorsFiles";
import prisma from "./prisma";

export async function deleteSponsorWithCleanup(id: string) {
  return prisma.$transaction(async (db) => {
    const sponsor = await db.sponsor.findUnique({where: {id}});
    if (!sponsor) {
      throw createError({statusCode: 404, statusMessage: "Sponsor introuvable."});
    }

    if (sponsor.logo) {
      await db.supabaseCleanupJob.create({data: {type: "STORAGE_OBJECT", bucket: SPONSORS_BUCKET, target: sponsor.logo}});
    }
    return db.sponsor.delete({where: {id}});
  }, {isolationLevel: "Serializable"}).catch((error: unknown) => {
    if (error && typeof error === "object" && "code" in error && error.code === "P2034") {
      throw createError({statusCode: 409, statusMessage: "Les données ont changé. Rechargez la page et réessayez."});
    }
    throw error;
  });
}
