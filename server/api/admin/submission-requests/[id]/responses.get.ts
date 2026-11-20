import * as v from "valibot";
import idParamSchema from "#shared/schemas/id";
import { getSubmissionTargetId, submissionResponseOrder } from "../../../../utils/submissionRequestProgress";

export default defineEventHandler(async (event) => {
  const {ability} = await requireOrganizerAccess(event);
  if (!canUsePermission(ability, "submissionRequests.read") || !canUsePermission(ability, "participants.read")) {
    throw createError({statusCode: 403, statusMessage: "Forbidden"});
  }

  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));
  const request = await prisma.submissionRequest.findUnique({
    where: {id},
    select: {
      teamRequest: true,
      type: true,
      submissions: {
        orderBy: [...submissionResponseOrder],
        select: {
          id: true, participantId: true, skipped: true, content: true, updatedAt: true,
          participant: {
            select: {
              team: {select: {id: true, name: true}},
              user: {select: {firstName: true, lastName: true}},
            },
          },
          files: {select: {id: true, bucket: true, path: true, originalName: true}},
        },
      },
    },
  });
  if (!request) throw createError({statusCode: 404, statusMessage: "Demande de soumission introuvable."});

  const seen = new Set<string>();
  return request.submissions.map(({participantId, participant, ...response}) => {
    const targetId = getSubmissionTargetId(request.teamRequest, participantId, participant.team?.id ?? null);
    const current = Boolean(targetId && !seen.has(targetId));

    if (targetId) seen.add(targetId);

    return {
      ...response,
      author: participant.user,
      team: request.teamRequest ? participant.team?.name ?? null : null,
      current,
      hasAnswer: request.type === SubmissionType.TEXT ? Boolean(response.content?.trim()) : response.files.length > 0,
    };
  });
});
