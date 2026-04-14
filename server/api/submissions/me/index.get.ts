export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "submissions.read.own");
  const participant = await getSubmissionActor(dbUser.id);

  return getAccessibleSubmissionsForParticipant(participant);
});
