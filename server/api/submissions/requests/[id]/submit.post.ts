import * as v from "valibot";
import submitTextSchema from "#shared/schemas/submissions/submitText";
import idParamSchema from "#shared/schemas/id";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "submissions.update.own");
  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));
  const participant = await getSubmissionActor(dbUser.id);

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

  const team = request.teamRequest ? participant.team : null;
  if (request.teamRequest && !team) {
    throw createError({statusCode: 400, statusMessage: "Cette demande doit être soumise au niveau de l'équipe."});
  }

  const data = await readValidatedBody(event, v.parser(submitTextSchema));

  // Required check
  if (request.required && (data.skipped || !data.content)) {
    throw createError({statusCode: 400, statusMessage: "Cette soumission est obligatoire."});
  }

  const existingSubmission = await findAccessibleSubmission({
    requestId: id,
    participantIds: team?.members.map((member) => member.id) ?? [participant.id],
  });

  const payload = {
    skipped: data.skipped ?? false,
    content: data.skipped ? null : (data.content ?? null),
    request: {connect: {id}},
    participant: {connect: {id: participant.id}},
  };

  if (!existingSubmission) {
    return prisma.submission.create({
      data: payload,
      include: accessibleSubmissionInclude,
    });
  }

  // Ensure files are cleared for text submissions/skip.
  return prisma.submission.update({
    where: {id: existingSubmission.id},
    data: {
      ...payload,
      files: {deleteMany: {}},
    },
    include: accessibleSubmissionInclude,
  });
});
