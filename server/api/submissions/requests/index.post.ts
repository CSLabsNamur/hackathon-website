import * as v from "valibot";
import { createSubmissionRequestSchema } from "#shared/schemas/submissions/requests/create";
import dayjs from "~~/server/utils/dayjs";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "submissionRequests.create");
  const editionId = await getCurrentEditionId();
  const body = await readBody(event);

  return withEventTransaction(editionId, async (db) => {
    const edition = await getCurrentEdition({startDate: true, endDate: true}, db);
    if (!edition) throw createError({statusCode: 503, statusMessage: "Les dates de l’événement sont indisponibles."});

    const parsed = v.safeParse(createSubmissionRequestSchema(edition.startDate, edition.endDate), body);
    if (!parsed.success) throw createError({statusCode: 400, statusMessage: parsed.issues[0].message});

    const {type, description, deadline, acceptedFormats, expectedEditionId, ...data} = parsed.output;
    if (expectedEditionId && expectedEditionId !== editionId) {
      throw createError({statusCode: 409, statusMessage: "L’édition a changé. Actualisez la page."});
    }

    return db.submissionRequest.create({
      data: {
        ...data,
        description: description || null,
        deadline: dayjs.tz(deadline, "Europe/Brussels").toDate(),
        type: type === "text" ? SubmissionType.TEXT : SubmissionType.FILE,
        multiple: type === "files",
        acceptedFormats: type === "text" ? undefined : normalizeAcceptedFormats(acceptedFormats),
      },
    });
  }).catch(handleSubmissionRequestWriteError);
});
