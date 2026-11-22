// Mainly AI generated code tbh. Submissions were a nightmare to work wwith.
import type { MaybeRefOrGetter } from "vue";
import { useRouteQuery } from "@vueuse/router";
import type { CurrentParticipantSubmission } from "#shared/utils/types";

export function useSubmissionWorkspace(requests: MaybeRefOrGetter<SubmissionRequest[] | null | undefined>, participant: MaybeRefOrGetter<CurrentParticipant | null | undefined>, now: MaybeRefOrGetter<Date>) {
  const selectedId = useRouteQuery<string>("request", "");

  const drafts = reactive<Record<string, SubmissionDraft>>({});

  const entries = computed(() =>
    getSortedSubmissionEntries(toValue(requests) ?? [], toValue(participant)?.submissions ?? [], toValue(now)),
  );

  const getSubmission = (request: SubmissionRequest) => toValue(participant)?.submissions.find((submission) => submission.requestId === request.id);

  const getDraftKey = (request: SubmissionRequest) => `${toValue(participant)?.id}:${request.teamRequest ? toValue(participant)?.team?.id ?? "no-team" : "individual"}:${request.id}:${request.type}`;

  watch([() => toValue(requests), () => toValue(participant)], ([currentRequests, currentParticipant]) => {
    if (!currentRequests || !currentParticipant) return;
    for (const request of currentRequests) {
      const key = getDraftKey(request);
      const submission = getSubmission(request);
      const draft = drafts[key];
      if (!draft || !isSubmissionDraftDirty(draft)) {
        drafts[key] = createSubmissionDraft(submission);
      } else {
        draft.conflict = draft.fingerprint !== getSubmissionFingerprint(submission);
      }
    }
  }, {immediate: true});

  watch([() => toValue(requests), () => toValue(participant), selectedId], ([currentRequests, currentParticipant]) => {
    if (!currentRequests || !currentParticipant) return;
    if (currentRequests.some((request) => request.id === selectedId.value)) return;
    selectedId.value = entries.value[0]?.request.id ?? "";
  }, {immediate: true});

  const activeEntry = computed(() => entries.value.find(({request}) => request.id === selectedId.value));
  const activeRequest = computed(() => activeEntry.value?.request);
  const activeDraft = computed({
    get: () => activeRequest.value ? drafts[getDraftKey(activeRequest.value)] : undefined,
    set: (draft) => {
      if (activeRequest.value && draft) drafts[getDraftKey(activeRequest.value)] = draft;
    },
  });

  const hasUnsavedChanges = computed(() => Object.values(drafts).some(isSubmissionDraftDirty));

  const resetDraft = (request: SubmissionRequest) => {
    drafts[getDraftKey(request)] = createSubmissionDraft(getSubmission(request));
  };

  const acceptSubmission = (request: SubmissionRequest, submission: CurrentParticipantSubmission | null, key: string, preserveDraft = false) => {
    const previous = drafts[key];
    drafts[key] = {
      ...createSubmissionDraft(submission), ...(preserveDraft && previous ? {
        content: previous.content,
        files: previous.files,
      } : {}),
    };
    if (getDraftKey(request) !== key) return;
    const current = toValue(participant);
    if (current) current.submissions = [...current.submissions.filter((saved) => saved.requestId !== request.id), ...(submission ? [submission] : [])];
  };

  return {
    selectedId,
    entries,
    activeEntry,
    activeRequest,
    activeDraft,
    hasUnsavedChanges,
    getDraftKey,
    resetDraft,
    acceptSubmission,
  };
}
