import * as v from "valibot";
import submitTextSchema from "#shared/schemas/submissions/submitText";
import idParamSchema from "#shared/schemas/id";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event, UserRole.USER);
  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const dbUser = await getDbUser(user);

  const request = await prisma.submissionRequest.findUnique({where: {id}});
  if (!request) {
    throw createError({statusCode: 404, statusMessage: "Demande de soumission introuvable."});
  }

  // Deadline check
  if (dayjs().isAfter(dayjs(request.deadline))) {
    throw createError({statusCode: 403, statusMessage: "La date limite de soumission est dépassée."});
  }

  if (request.type !== SubmissionType.TEXT) {
    throw createError({statusCode: 400, statusMessage: "Cette demande nécessite un ou plusieurs fichiers."});
  }

  const data = await readValidatedBody(event, v.parser(submitTextSchema));

  // Required check
  if (request.required && (data.skipped || !data.content)) {
    throw createError({statusCode: 400, statusMessage: "Cette soumission est obligatoire."});
  }

  const payload = {
    skipped: data.skipped ?? false,
    content: data.skipped ? null : (data.content ?? null),
    request: {connect: {id}},
    participant: {connect: {userId: dbUser.id}},
  };

  // Ensure files are cleared for text submissions/skip
  return prisma.submission.upsert({
    where: {
      requestId_participantId: {
        requestId: id,
        participantId: dbUser.id,
      },
    },
    create: payload,
    update: {
      ...payload,
      files: {deleteMany: {}},
    },
    include: {files: true, request: true},
  });
});
