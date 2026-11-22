<script setup lang="ts">
const props = defineProps<{ participant: CurrentParticipant; now: Date }>();

const {data: requests, status, refresh} = await useSubmissionsRequests({lazy: true});

const entries = computed(() => getSortedSubmissionEntries(requests.value ?? [], props.participant.submissions, props.now));
const upcoming = computed(() => entries.value.filter((entry) => entry.state.status === "pending"));
const missed = computed(() => entries.value.filter((entry) => entry.request.required && entry.state.status === "overdue"));
const previewLimit = 4;

const groups = computed(() => [
  {id: "upcoming", entries: upcoming.value.slice(0, previewLimit)},
  {id: "missed", title: "Livrables obligatoires en retard", entries: missed.value},
].filter((group) => group.entries.length));

useRefreshOnPageReturn(refresh);
</script>

<template>
  <UCard v-if="status !== 'success' || requests?.length" :ui="{body: 'p-0 sm:p-0'}">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-lg font-semibold text-highlighted">À déposer</h2>
        <UButton to="/participant/submit" color="neutral" variant="ghost" size="sm"
                 trailing-icon="i-lucide-arrow-right" aria-label="Voir tous les livrables"/>
      </div>
    </template>

    <div v-if="status === 'error'" class="p-4 sm:p-6">
      <UAlert color="error" variant="soft" icon="i-lucide-circle-alert"
              title="Impossible de charger les demandes de dépôt"
              :actions="[{label: 'Réessayer', color: 'error', variant: 'soft', onClick: () => refresh()}]"/>
    </div>
    <div v-else-if="!requests" class="grid gap-4 p-4 sm:p-6">
      <USkeleton v-for="n in 2" :key="n" class="h-16"/>
    </div>
    <div v-else-if="groups.length" class="divide-y divide-default">
      <div v-for="group in groups" :key="group.id">
        <h3 v-if="group.title" class="px-4 pt-4 text-sm font-medium text-highlighted sm:px-6">
          {{ group.title }}
        </h3>
        <ul class="divide-y divide-default">
          <li v-for="{request, state} in group.entries" :key="request.id">
            <NuxtLink :to="{path: '/participant/submit', query: {request: request.id}}"
                      class="flex items-start gap-3 p-4 transition-colors hover:bg-elevated/50
                             focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:p-6">
              <UIcon :name="request.teamRequest ? 'i-lucide-users' : 'i-lucide-user'"
                     class="mt-0.5 size-5 shrink-0 text-muted" aria-hidden="true"/>
              <div class="flex-1 grid gap-1.5">
                <span class="font-medium text-highlighted wrap-anywhere">{{ request.title }}</span>
                <div class="flex flex-wrap items-center gap-2">
                  <UBadge :color="state.color" variant="subtle" size="sm">{{ state.label }}</UBadge>
                  <UBadge v-if="!request.required" color="neutral" variant="subtle" size="sm">Facultatif</UBadge>
                </div>
                <p class="text-sm text-muted">
                  {{ request.teamRequest ? "Un dépôt par équipe" : "Dépôt individuel" }}
                  <span v-if="request.teamRequest && !participant.team && state.status === 'pending'">
                    · Rejoignez une équipe pour déposer
                  </span>
                </p>
                <p class="text-sm text-muted">
                  Échéance : {{ formatDate(request.deadline, "D MMMM à HH[h]mm") }}
                </p>
              </div>
              <UIcon name="i-lucide-chevron-right" class="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true"/>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>

    <UEmpty v-else title="Aucun dépôt en attente" icon="i-lucide-folder-open" variant="naked"/>

    <template v-if="status !== 'error' && upcoming.length > previewLimit" #footer>
      <UButton to="/participant/submit" color="neutral" variant="link" class="p-0"
               trailing-icon="i-lucide-arrow-right">
        Voir les autres livrables
      </UButton>
    </template>
  </UCard>
</template>
