import type { MaybeRefOrGetter } from "vue";
import { useRouteQuery } from "@vueuse/router";
import type { CurrentParticipantSubmission } from "#shared/utils/types";

export function useSubmissionWorkspace(requests: MaybeRefOrGetter<SubmissionRequest[] | null | undefined>, participant: MaybeRefOrGetter<CurrentParticipant | null | undefined>) {
  const dayjs = useDayjs();

  const selectedId = useRouteQuery<string>("request", "");

  const drafts = reactive<Record<string, SubmissionDraft>>({});

  const sortedRequests = computed(() => [...(toValue(requests) ?? [])]
    .sort((a, b) => dayjs(a.deadline).valueOf() - dayjs(b.deadline).valueOf() || a.title.localeCompare(b.title, "fr")),
  );

  const getSubmission = (request: SubmissionRequest) => toValue(participant)?.submissions.find((submission) => submission.requestId === request.id);

  const getDraftKey = (request: SubmissionRequest) => `${toValue(participant)?.id}:${request.teamRequest ? toValue(participant)?.team?.id ?? "no-team" : "individual"}:${request.id}:${request.type}`;

  watch([sortedRequests, () => toValue(participant)], () => {
    if (!toValue(requests) || !toValue(participant)) return;
    for (const request of sortedRequests.value) {
      const key = getDraftKey(request);
      const submission = getSubmission(request);
      const draft = drafts[key];
      if (!draft || !isSubmissionDraftDirty(draft)) {
        drafts[key] = createSubmissionDraft(submission);
      } else {
        draft.conflict = draft.fingerprint !== getSubmissionFingerprint(submission);
      }
    }
    if (!sortedRequests.value.some((request) => request.id === selectedId.value)) {
      const pending = sortedRequests.value.filter((request) => !getSubmissionState(request, getSubmission(request)).completed);
      selectedId.value = (pending.find((request) => dayjs().isBefore(request.deadline)) ?? pending[0] ?? sortedRequests.value[0])?.id ?? "";
    }
  }, {immediate: true});

  const activeRequest = computed(() => sortedRequests.value.find((request) => request.id === selectedId.value) ?? null);
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
    sortedRequests,
    activeRequest,
    activeDraft,
    hasUnsavedChanges,
    getSubmission,
    getDraftKey,
    resetDraft,
    acceptSubmission,
  };
}
