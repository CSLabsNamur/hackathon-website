import { getSubmissionRequestProgress, submissionResponseOrder } from "../../../utils/submissionRequestProgress";

export default defineEventHandler(async (event) => {
  const {ability} = await requireOrganizerAccess(event);
  if (!canUsePermission(ability, "submissionRequests.read")) {
    throw createError({statusCode: 403, statusMessage: "Forbidden"});
  }
  const canReadResponses = canUsePermission(ability, "participants.read");

  return prisma.$transaction(async (db) => {
    const settings = await getCurrentEdition({editionId: true, startDate: true, endDate: true}, db);
    const requests = await db.submissionRequest.findMany({
      orderBy: [{deadline: "asc"}, {id: "asc"}],
      include: {_count: {select: {submissions: true}}},
    });
    if (!canReadResponses) {
      return {settings, requests: requests.map((request) => ({...request, progress: null}))};
    }

    const participants = await db.participant.groupBy({by: ["teamId"], _count: {_all: true}});
    const totalParticipants = participants.reduce((total, group) => total + group._count._all, 0);

    const totalTeams = participants.filter((group) => group.teamId !== null).length;

    const responses = await db.submission.findMany({
      orderBy: [...submissionResponseOrder],
      select: {
        requestId: true, participantId: true, skipped: true, content: true,
        participant: {select: {teamId: true}},
        _count: {select: {files: true}},
      },
    });
    const responsesByRequest = Map.groupBy(responses, ({requestId}) => requestId);

    return {
      settings,
      requests: requests.map((request) => {
        const records = (responsesByRequest.get(request.id) ?? []).map((response) => ({
          participantId: response.participantId,
          teamId: response.participant.teamId,
          skipped: response.skipped,
          hasAnswer: request.type === SubmissionType.TEXT ? Boolean(response.content?.trim()) : response._count.files > 0,
        }));
        return {
          ...request,
          progress: {
            ...getSubmissionRequestProgress(request.teamRequest, records),
            total: request.teamRequest ? totalTeams : totalParticipants,
          },
        };
      }),
    };
  }, {isolationLevel: "RepeatableRead"});
});
