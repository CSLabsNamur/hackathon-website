import { createError } from "h3";
import prisma from "./prisma";

export async function deleteSubmissionRequestWithCleanup(id: string, canDeleteSubmissions: boolean) {
  return prisma.$transaction(async (db) => {
    const submissionRequest = await db.submissionRequest.findUnique({
      where: {id},
      include: {submissions: {include: {files: true}}},
    });
    if (!submissionRequest) {
      throw createError({statusCode: 404, statusMessage: "Demande de soumission introuvable."});
    }

    if (submissionRequest.submissions.length > 0 && !canDeleteSubmissions) {
      throw createError({
        statusCode: 400,
        statusMessage: "Impossible de supprimer une demande de soumission qui a déjà des soumissions associées sans être super admin.",
      });
    }

    const files = submissionRequest.submissions.flatMap((submission) => submission.files);
    if (files.length) {
      await db.supabaseCleanupJob.createMany({
        data: files.map((file) => ({type: "STORAGE_OBJECT", bucket: file.bucket, target: file.path})),
      });
    }
    return db.submissionRequest.delete({where: {id}});
  }, {isolationLevel: "Serializable"}).catch((error: unknown) => {
    if (error && typeof error === "object" && "code" in error && error.code === "P2034") {
      throw createError({statusCode: 409, statusMessage: "Les données ont changé. Rechargez la page et réessayez."});
    }
    throw error;
  });
}
