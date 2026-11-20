import type { CurrentParticipantSubmission } from "#shared/utils/types";

export type SubmissionDraft = {
  content: string;
  files: File[];
  baselineContent: string;
  expectedUpdatedAt: string | null;
  fingerprint: string;
  conflict: boolean;
};

export const isSubmissionDraftDirty = (draft: SubmissionDraft) => draft.content !== draft.baselineContent || draft.files.length > 0;

export const getSubmissionFingerprint = (submission?: CurrentParticipantSubmission | null) => JSON.stringify([
  submission?.id, submission?.updatedAt, submission?.skipped, submission?.content, submission?.files.map((file) => file.id),
]);

export const createSubmissionDraft = (submission?: CurrentParticipantSubmission | null): SubmissionDraft => ({
  content: submission?.content ?? "",
  files: [],
  baselineContent: submission?.content ?? "",
  expectedUpdatedAt: submission?.updatedAt ?? null,
  fingerprint: getSubmissionFingerprint(submission),
  conflict: false,
});

export function getSubmissionState(request: SubmissionRequest, submission?: CurrentParticipantSubmission | null, referenceTime: Date = new Date()) {
  if (submission?.skipped && !request.required) return {label: "Non remis", color: "neutral" as const, completed: true};

  const submitted = request.type === "TEXT" ? Boolean(submission?.content?.trim()) : Boolean(submission?.files.length);
  if (submitted && !submission?.skipped) return {label: "Remis", color: "success" as const, completed: true};

  if (new Date(request.deadline).getTime() <= referenceTime.getTime()) {
    return {label: "Échéance dépassée", color: "neutral" as const, completed: false};
  }

  return {label: "À remettre", color: "warning" as const, completed: false};
}
