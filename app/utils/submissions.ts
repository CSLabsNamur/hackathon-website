import type { CurrentParticipantSubmission, SubmissionRequest } from "#shared/utils/types";

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

export type SubmissionStatus = "pending" | "submitted" | "skipped" | "overdue";

export type SubmissionState = {
  status: SubmissionStatus;
  label: string;
  color: "neutral" | "success" | "warning";
};

export function getSubmissionState(request: SubmissionRequest, submission?: CurrentParticipantSubmission | null, referenceTime: Date = new Date()): SubmissionState {
  if (submission?.skipped && !request.required) {
    return {status: "skipped", label: "Non remis", color: "neutral"};
  }

  const submitted = request.type === "TEXT" ? Boolean(submission?.content?.trim()) : Boolean(submission?.files.length);
  if (submitted && !submission?.skipped) {
    return {status: "submitted", label: "Remis", color: "success"};
  }

  if (new Date(request.deadline).getTime() <= referenceTime.getTime()) {
    return {status: "overdue", label: "Échéance dépassée", color: "neutral"};
  }

  return {status: "pending", label: "À remettre", color: "warning"};
}

function getSubmissionPriority(required: boolean, status: SubmissionStatus) {
  if (status === "pending") return required ? 0 : 1;
  if (status === "overdue") return required ? 2 : 4;
  return 3;
}

export function getSortedSubmissionEntries(requests: SubmissionRequest[], submissions: CurrentParticipantSubmission[], now: Date) {
  return requests.map((request) => {
    const submission = submissions.find((item) => item.requestId === request.id);
    const state = getSubmissionState(request, submission, now);
    return {request, submission, state};
  }).sort((a, b) => getSubmissionPriority(a.request.required, a.state.status) - getSubmissionPriority(b.request.required, b.state.status)
      || new Date(a.request.deadline).getTime() - new Date(b.request.deadline).getTime()
      || a.request.title.localeCompare(b.request.title, "fr"));
}
