<script setup lang="ts">
import type { CurrentParticipantSubmission } from "#shared/utils/types";

definePageMeta({
  layout: {
    name: "user-dashboard",
    props: {
      title: "Dépôt",
    },
  },
  middleware: "participant-auth",
  requiredPermissions: ["submissionRequests.read", "submissions.read.own"],
});

const [
  {data: requestsData, status: requestsStatus, refresh: refreshRequests},
  {data: participantData, status: participantStatus, refresh: refreshParticipant},
] = await Promise.all([useSubmissionsRequests({lazy: true}), useCurrentParticipant()]);

// Retain the last successful data so a failed refresh cannot destroy local drafts
const requests = ref(requestsData.value);
const participant = ref(participantData.value);
watch(requestsData, (value) => {
  if (value) requests.value = value;
});
watch(participantData, (value) => {
  if (value) participant.value = value;
});

const {can} = useAbility(participant);
const actions = useSubmissionsActions();
const toast = useToast();
const dayjs = useDayjs();
const now = useNow();
const workspace = useSubmissionWorkspace(requests, participant);

const {selectedId, sortedRequests, activeRequest, activeDraft, hasUnsavedChanges} = workspace;

const requestOptions = computed(() => sortedRequests.value.map((request) => ({
  label: request.title,
  value: request.id,
})));

const activeSubmission = computed(() => activeRequest.value ? workspace.getSubmission(activeRequest.value) : undefined);

const loadError = computed(() => requestsStatus.value === "error" || participantStatus.value === "error");

const canSkip = computed(() => {
  const request = activeRequest.value;
  const draft = activeDraft.value;
  if (!request || request.required || !draft) return false;
  return !activeSubmission.value?.skipped || isSubmissionDraftDirty(draft);
});

const busy = ref(false);
const mutationError = ref<string | null>(null);
const confirmation = ref({title: "", description: ""});

const locked = computed(() => busy.value || isRevealed.value);
const deadlinePassed = computed(() => Boolean(activeRequest.value && !dayjs(now.value).isBefore(activeRequest.value.deadline)));
const missingTeam = computed(() => Boolean(activeRequest.value?.teamRequest && !participant.value?.team));
const readOnly = computed(() => loadError.value || deadlinePassed.value || missingTeam.value || Boolean(activeDraft.value?.conflict));

const {isRevealed, reveal, confirm, cancel} = useConfirmDialog();
const askConfirmation = async (title: string, description: string) => {
  if (isRevealed.value) return false;
  confirmation.value = {title, description};
  return !(await reveal()).isCanceled;
};
const reload = async () => {
  if (locked.value) return;
  await Promise.all([refreshParticipant(), refreshRequests()]);
};
const discardDraft = async () => {
  if (!activeRequest.value || locked.value) return;
  if (!await askConfirmation("Recharger la réponse ?", "Votre brouillon sera remplacé par la dernière réponse enregistrée.")) return;
  workspace.resetDraft(activeRequest.value);
};

const mutate = async (operation: "save" | "skip" | "delete", fileId = "") => {
  const request = activeRequest.value;
  const draft = activeDraft.value;

  const deleting = operation === "delete";
  const skipping = operation === "skip";

  if (!request || !draft || locked.value || readOnly.value) return;
  if (!can(deleting ? "deleteOwn" : "updateOwn", "Submission")) return;
  if (deleting && !fileId) return;
  if (skipping && !canSkip.value) return;

  const key = workspace.getDraftKey(request);
  const needsConfirmation = deleting || (skipping && (activeSubmission.value || isSubmissionDraftDirty(draft)));
  if (needsConfirmation) {
    const confirmed = deleting
        ? await askConfirmation("Supprimer ce fichier ?", "Le fichier sera retiré du dépôt de manière définitive.")
        : await askConfirmation(
            "Ne pas remettre ce livrable ?",
            "La réponse et les fichiers déjà enregistrés seront supprimés, ainsi que votre brouillon.",
        );
    if (!confirmed) return;

    const currentRequest = activeRequest.value;
    if (!currentRequest || workspace.getDraftKey(currentRequest) !== key) return;
    if (locked.value || readOnly.value || !can(deleting ? "deleteOwn" : "updateOwn", "Submission")) return;
    if (skipping && !canSkip.value) return;
  }

  busy.value = true;
  mutationError.value = null;
  try {
    let result: CurrentParticipantSubmission | null;
    let title: string;

    if (deleting) {
      result = await actions.deleteSubmissionFile(request.id, fileId);
      title = "Fichier supprimé";
    } else {
      const data = {
        skipped: skipping,
        expectedUpdatedAt: draft.expectedUpdatedAt,
        expectedTeamId: request.teamRequest ? participant.value?.team?.id ?? null : undefined,
      };
      if (request.type === "TEXT") {
        result = await actions.submitText(request.id, {...data, content: skipping ? undefined : draft.content});
      } else {
        result = await actions.uploadFiles(request.id, {...data, files: skipping ? undefined : draft.files});
      }
      title = skipping ? "Choix enregistré" : "Dépôt enregistré";
    }

    workspace.acceptSubmission(request, result, key, deleting);
    toast.add({id: "participant-submission", title, color: "success"});
  } catch (error) {
    const statusMessage = (error as { data?: { statusMessage?: string } }).data?.statusMessage;
    mutationError.value = statusMessage || "L'opération n'a pas pu être terminée. Votre brouillon a été conservé.";
  } finally {
    await refreshParticipant({dedupe: "cancel"}).finally(() => {
      busy.value = false;
    });
  }
};

useRefreshOnPageReturn(reload);
useEventListener("beforeunload", (event) => {
  if (!hasUnsavedChanges.value && !busy.value) return;
  event.preventDefault();
});
onBeforeRouteLeave(async (to, from) => {
  if (to.path === from.path) return true;
  if (busy.value) return false;
  if (!hasUnsavedChanges.value) return true;
  return askConfirmation("Quitter le dépôt ?", "Vos brouillons non enregistrés seront perdus.");
});
</script>

<template>
  <UContainer class="grid gap-6 max-w-7xl">
    <header>
      <h1 class="text-2xl font-semibold text-highlighted">Dépôt</h1>
    </header>

    <UAlert v-if="loadError" color="error" variant="soft" icon="i-lucide-circle-alert"
            title="Impossible d'actualiser les dépôts"
            description="Vos brouillons sont conservés. Actualisez les données avant de continuer."
            :actions="[{label: 'Réessayer', color: 'error', variant: 'soft', disabled: locked, onClick: reload}]"/>

    <div v-if="(!requests || !participant) && !loadError" class="grid gap-6 lg:grid-cols-3">
      <USkeleton class="h-80"/>
      <USkeleton class="h-96 lg:col-span-2"/>
    </div>

    <UEmpty v-else-if="requests && !sortedRequests.length" title="Aucun livrable demandé"
            icon="i-lucide-folder-open"/>

    <div v-else-if="participant && activeRequest && activeDraft" class="grid items-start gap-6 lg:grid-cols-3">
      <UCard :ui="{body: 'p-2 sm:p-2'}" class="hidden min-w-0 lg:block">
        <template #header>
          <h2 class="text-lg font-semibold text-highlighted">Livrables</h2>
        </template>
        <ul class="grid gap-1">
          <li v-for="request in sortedRequests" :key="request.id">
            <UButton :variant="selectedId === request.id ? 'soft' : 'ghost'" color="neutral"
                     class="w-full justify-start p-3" :disabled="locked"
                     :aria-current="selectedId === request.id ? 'true' : undefined"
                     @click="selectedId = request.id; mutationError = null">
              <span class="min-w-0 flex-1 grid gap-2 text-left">
                <span class="font-medium whitespace-normal wrap-anywhere">{{ request.title }}</span>
                <span class="flex flex-wrap items-center gap-2">
                  <UBadge :color="getSubmissionState(request, workspace.getSubmission(request), now).color"
                          variant="subtle" size="sm">
                    {{ getSubmissionState(request, workspace.getSubmission(request), now).label }}
                  </UBadge>
                  <span class="text-xs text-muted">{{ formatDate(request.deadline, "D MMM à HH[h]mm") }}</span>
                </span>
              </span>
            </UButton>
          </li>
        </ul>
      </UCard>

      <USelect v-model="selectedId" :items="requestOptions" :disabled="locked"
               aria-label="Choisir un livrable" class="w-full lg:hidden"/>

      <div class="min-w-0 grid gap-4 lg:col-span-2">
        <UAlert v-if="mutationError" color="error" variant="soft" icon="i-lucide-circle-alert"
                title="Opération non terminée" :description="mutationError"/>

        <UCard>
          <template #header>
            <div class="grid gap-3">
              <h2 class="text-lg font-semibold text-highlighted wrap-anywhere">{{ activeRequest.title }}</h2>
              <div class="flex flex-wrap gap-2">
                <UBadge color="neutral" variant="subtle"
                        :icon="activeRequest.teamRequest ? 'i-lucide-users' : 'i-lucide-user'">
                  {{ activeRequest.teamRequest ? "Un dépôt par équipe" : "Dépôt individuel" }}
                </UBadge>
                <UBadge :color="activeRequest.required ? 'primary' : 'neutral'" variant="subtle">
                  {{ activeRequest.required ? "Obligatoire" : "Facultatif" }}
                </UBadge>
                <UBadge v-if="activeSubmission" :color="getSubmissionState(activeRequest, activeSubmission, now).color"
                        variant="subtle">
                  {{ getSubmissionState(activeRequest, activeSubmission, now).label }}
                </UBadge>
              </div>
              <p v-if="activeRequest.description" class="text-sm text-muted whitespace-pre-line wrap-anywhere">
                {{ activeRequest.description }}
              </p>
              <p class="text-sm text-muted">
                Échéance : {{ formatDate(activeRequest.deadline, "D MMMM à HH[h]mm") }}
              </p>
            </div>
          </template>

          <div :key="workspace.getDraftKey(activeRequest)" class="grid gap-5">
            <p v-if="activeSubmission" class="text-sm text-muted">
              {{ activeSubmission.skipped ? "Choix enregistré" : "Dernier enregistrement" }}
              le {{ formatDate(activeSubmission.updatedAt, "D MMMM à HH[h]mm") }}
              <span v-if="activeRequest.teamRequest">
                · Dépôt de {{
                  activeSubmission.participant.user.firstName
                }} {{ activeSubmission.participant.user.lastName }}
              </span>
            </p>
            <UAlert v-if="deadlinePassed" color="neutral" variant="soft" icon="i-lucide-clock"
                    title="La date limite est dépassée" description="Les dépôts restent consultables."/>
            <UAlert v-if="activeDraft.conflict" color="warning" variant="soft" icon="i-lucide-circle-alert"
                    title="Une autre réponse a été enregistrée"
                    description="Votre brouillon est conservé. Rechargez la réponse avant de la modifier."
                    :actions="[{label: 'Recharger la réponse', color: 'warning', variant: 'soft', disabled: locked, onClick: discardDraft}]"/>
            <ParticipantNoTeamCTA v-if="missingTeam"/>
            <template v-else>
              <ParticipantSubmissionFormText v-if="activeRequest.type === 'TEXT'"
                                             v-model="activeDraft" :can-skip="canSkip"
                                             :disabled="readOnly || !can('updateOwn', 'Submission')"
                                             :busy="locked" @submit="mutate('save')" @skip="mutate('skip')"/>
              <ParticipantSubmissionFormFiles v-else v-model="activeDraft"
                                              :submission-request="activeRequest" :submission="activeSubmission"
                                              :can-skip="canSkip"
                                              :disabled="readOnly" :can-submit="can('updateOwn', 'Submission')"
                                              :busy="locked" :can-delete="can('deleteOwn', 'Submission')"
                                              @submit="mutate('save')" @skip="mutate('skip')"
                                              @delete-file="mutate('delete', $event)"/>
              <p v-if="isSubmissionDraftDirty(activeDraft)" class="text-xs text-muted" role="status">
                Brouillon non enregistré
              </p>
            </template>
          </div>
        </UCard>
      </div>
    </div>

    <UModal :open="isRevealed" :title="confirmation.title" :description="confirmation.description"
            :ui="{footer: 'justify-end'}" @update:open="!$event && cancel()">
      <template #footer>
        <UButton color="neutral" variant="soft" @click="cancel()">Annuler</UButton>
        <UButton @click="confirm()">Confirmer</UButton>
      </template>
    </UModal>
  </UContainer>
</template>
