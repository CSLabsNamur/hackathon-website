import * as v from "valibot";
import { deleteSubmissionFileParamsSchema } from "#shared/schemas/submissions/files/delete";
import { serverSupabaseServiceRole } from "#supabase/server";
import { SUBMISSIONS_BUCKET } from "~~/server/utils/submissionsFiles";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event, UserRole.USER);
  const {id: requestId, fileId} = await getValidatedRouterParams(event, v.parser(deleteSubmissionFileParamsSchema));

  const participant = await getParticipant(user);

  const request = await prisma.submissionRequest.findUnique({where: {id: requestId}});
  if (!request) {
    throw createError({statusCode: 404, statusMessage: "Demande de soumission introuvable."});
  }

  if (request.type !== SubmissionType.FILE) {
    throw createError({statusCode: 400, statusMessage: "Cette demande n'attend pas de fichier."});
  }

  if (dayjs().isAfter(dayjs(request.deadline))) {
    throw createError({statusCode: 403, statusMessage: "La date limite de soumission est dépassée."});
  }

  const submission = await prisma.submission.findUnique({
    where: {
      requestId_participantId: {
        requestId,
        participantId: participant.id,
      },
    },
    include: {
      files: true,
    },
  });

  if (!submission) {
    throw createError({statusCode: 404, statusMessage: "Aucune soumission trouvée pour cette demande."});
  }

  const file = submission.files.find((f: { id: string }) => f.id === fileId);
  if (!file) {
    throw createError({statusCode: 404, statusMessage: "Fichier introuvable."});
  }

  const supabase = serverSupabaseServiceRole(event);

  // Delete storage object first
  const {error} = await supabase.storage.from(SUBMISSIONS_BUCKET).remove([file.path]);
  if (error) {
    throw createError({statusCode: 500, statusMessage: "Erreur lors de la suppression du fichier."});
  }

  await prisma.submissionFile.delete({where: {id: file.id}});

  // If that was the last file, delete the submission as well
  const remaining = await prisma.submissionFile.count({where: {submissionId: submission.id}});
  if (remaining === 0) {
    await prisma.submission.delete({where: {id: submission.id}});
  }

  return prisma.submission.findUnique({
    where: {id: submission.id},
    include: {files: true, request: true},
  });
});
