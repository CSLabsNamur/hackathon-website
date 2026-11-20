import * as v from "valibot";
import idParamSchema from "#shared/schemas/id";
import { editSubmissionRequestSchema } from "#shared/schemas/submissions/requests/edit";
import dayjs from "~~/server/utils/dayjs";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "submissionRequests.update");

  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));
  const editionId = await getCurrentEditionId();

  const body = await readBody(event);

  return withEventTransaction(editionId, async (db) => {
    const request = await db.submissionRequest.findUnique({
      where: {id},
      include: {_count: {select: {submissions: true}}},
    });
    if (!request) throw createError({statusCode: 404, statusMessage: "Demande de soumission introuvable."});

    const edition = await getCurrentEdition({startDate: true, endDate: true}, db);
    if (!edition) throw createError({statusCode: 503, statusMessage: "Les dates de l’événement sont indisponibles."});

    const parsed = v.safeParse(editSubmissionRequestSchema(edition.startDate, edition.endDate), body);
    if (!parsed.success) throw createError({statusCode: 400, statusMessage: parsed.issues[0].message});

    const {title, description, deadline, required, teamRequest, acceptedFormats, expectedUpdatedAt} = parsed.output;
    if (expectedUpdatedAt && request.updatedAt.toISOString() !== expectedUpdatedAt) {
      throw createError({
        statusCode: 409,
        statusMessage: "Cette demande a été modifiée. Actualisez la page avant de réessayer.",
      });
    }

    const formats = request.type === SubmissionType.FILE && acceptedFormats !== undefined
      ? normalizeAcceptedFormats(acceptedFormats)
      : undefined;
    const hasResponses = request._count.submissions > 0;
    if (hasResponses && (
      (required !== undefined && required !== request.required)
      || (teamRequest !== undefined && teamRequest !== request.teamRequest)
      || (formats && [...formats].sort().join(",") !== normalizeAcceptedFormats(request.acceptedFormats).sort().join(","))
    )) {
      throw createError({
        statusCode: 409,
        statusMessage: "La portée, le caractère obligatoire et les formats sont verrouillés après la première réponse.",
      });
    }

    return db.submissionRequest.update({
      where: {id},
      data: {
        title,
        description: description === undefined ? undefined : description || null,
        deadline: dayjs.tz(deadline, "Europe/Brussels").toDate(),
        required: hasResponses ? undefined : required,
        teamRequest: hasResponses ? undefined : teamRequest,
        acceptedFormats: hasResponses ? undefined : formats,
      },
    });
  }).catch(handleSubmissionRequestWriteError);
});
