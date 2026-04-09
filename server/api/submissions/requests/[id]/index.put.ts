import { editSubmissionRequestSchema } from "#shared/schemas/submissions/requests/edit";
import * as v from "valibot";
import idParamSchema from "#shared/schemas/id";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "submissionRequests.update");
  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const settings = await getPublicSettings(event);
  const schema = editSubmissionRequestSchema(settings.event.startDate, settings.event.endDate);

  const data = await readValidatedBody(event, v.parser(schema));

  const payload = {
    ...data,
  };

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
    throw createError({statusCode: 404, statusMessage: "Demande de soumission introuvable."});
  }

  if (submissionRequest._count.submissions > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Impossible de modifier une demande de soumission qui a déjà des soumissions associées.",
    });
  }

  return prisma.submissionRequest.update({where: {id}, data: payload});
});
