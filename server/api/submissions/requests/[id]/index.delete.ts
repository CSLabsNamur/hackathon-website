import idParamSchema from "#shared/schemas/id";
import * as v from "valibot";
import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "submissionRequests.delete");

  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const submissionRequest = await prisma.submissionRequest.findUnique({
    where: {id},
    include: {
      submissions: {
        include: {
          files: true,
        },
      },
    },
  });

  if (!submissionRequest) {
    throw createError({statusCode: 404, statusMessage: "Demande de soumission introuvable."});
  }

  if (submissionRequest.submissions.length > 0 && !isSuperAdmin(dbUser)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Impossible de supprimer une demande de soumission qui a déjà des soumissions associées sans être super admin.",
    });
  }

  const filePaths = submissionRequest.submissions.flatMap((submission) => submission.files.map((file) => file.path));

  if (filePaths.length > 0) {
    const {error} = await serverSupabaseServiceRole(event).storage.from(SUBMISSIONS_BUCKET).remove(filePaths);

    if (error) {
      console.error("Erreur lors de la suppression des fichiers de soumission:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Erreur lors de la suppression des fichiers de soumission.",
      });
    }
  }

  return prisma.submissionRequest.delete({where: {id}});
});
