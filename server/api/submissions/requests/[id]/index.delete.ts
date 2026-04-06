import idParamSchema from "#shared/schemas/id";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "submissionRequests.delete");

  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const submissionRequest = await prisma.submissionRequest.findUnique({
    where: {id},
    select: {
      _count: {
        select: {
          submissions: true,
        },
      },
    },
  });

  if (!submissionRequest) {
    throw createError({statusCode: 404, message: "Demande de soumission introuvable."});
  }

  if (submissionRequest._count.submissions > 0 && !isSuperAdmin(dbUser)) {
    throw createError({
      statusCode: 400,
      message: "Impossible de supprimer une demande de soumission qui a déjà des soumissions associées sans être super admin.",
    });
  }

  return prisma.submissionRequest.delete({where: {id}});
});
