import { createError } from "h3";
import { getCurrentEditionId, withEventTransaction } from "./eventEdition";
import { queueSubmissionFilesCleanup } from "./submissions";

export async function deleteSubmissionRequestWithCleanup(id: string, canDeleteSubmissions: boolean) {
  const editionId = await getCurrentEditionId();
  return withEventTransaction(editionId, async (db) => {
    const submissionRequest = await db.submissionRequest.findUnique({
      where: {id},
      select: {submissions: {select: {files: {select: {bucket: true, path: true}}}}},
    });
    if (!submissionRequest) {
      throw createError({statusCode: 404, statusMessage: "Demande de soumission introuvable."});
    }
    if (submissionRequest.submissions.length && !canDeleteSubmissions) {
      throw createError({
        statusCode: 409,
        statusMessage: "Seuls les super administrateurs peuvent supprimer une demande ayant reçu des réponses.",
      });
    }

    await queueSubmissionFilesCleanup(db, submissionRequest.submissions.flatMap((submission) => submission.files));
    return db.submissionRequest.delete({where: {id}});
  });
}

export function handleSubmissionRequestWriteError(error: unknown): never {
  if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
    throw createError({statusCode: 409, statusMessage: "Une demande porte déjà ce titre et cette échéance."});
  }
  throw error;
}
