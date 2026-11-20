export const submissionResponseOrder = [
  {updatedAt: "desc"},
  {createdAt: "desc"},
  {id: "desc"},
] as const;

export function getSubmissionTargetId(teamRequest: boolean, participantId: string, teamId: string | null) {
  return teamRequest ? teamId : participantId;
}

// Records are ordered newest first, as in the participant workspace.
export function getSubmissionRequestProgress(teamRequest: boolean, records: {
  participantId: string;
  teamId: string | null;
  skipped: boolean;
  hasAnswer: boolean;
}[]) {
  const seen = new Set<string>();
  let submitted = 0;
  let skipped = 0;

  for (const record of records) {
    const id = getSubmissionTargetId(teamRequest, record.participantId, record.teamId);
    if (!id || seen.has(id)) continue;

    seen.add(id);
    if (record.skipped) skipped++;
    else if (record.hasAnswer) submitted++;
  }

  return {submitted, skipped};
}
