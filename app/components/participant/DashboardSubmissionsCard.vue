<script setup lang="ts">
const props = defineProps<{ participant: CurrentParticipant; now: Date }>();

const {data: requests, status, refresh} = await useSubmissionsRequests({lazy: true});
const dayjs = useDayjs();

const submittedIds = computed(() => new Set(props.participant.submissions.map((submission) => submission.requestId)));
const pendingRequests = computed(() => (requests.value ?? [])
    .filter((request) => !submittedIds.value.has(request.id))
    .sort((a, b) => dayjs(a.deadline).valueOf() - dayjs(b.deadline).valueOf()),
);

useRefreshOnPageReturn(refresh);
</script>

<template>
  <UCard v-if="status !== 'success' || requests?.length" :ui="{body: 'p-0 sm:p-0'}">
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-lg font-semibold text-highlighted">À déposer</h2>
        <UButton to="/participant/submit" color="neutral" variant="ghost" size="sm"
                 trailing-icon="i-lucide-arrow-right"/>
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
    <ul v-else-if="pendingRequests.length" class="divide-y divide-default">
      <li v-for="request in pendingRequests.slice(0, 4)" :key="request.id"
          class="flex items-start gap-3 p-4 sm:p-6">
        <UIcon :name="request.teamRequest ? 'i-lucide-users' : 'i-lucide-user'"
               class="mt-1 size-5 shrink-0 text-muted"/>
        <div class="min-w-0 flex-1 space-y-1.5">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="font-medium text-highlighted">{{ request.title }}</h3>
            <UBadge v-if="!request.required" color="neutral" variant="subtle" size="sm">
              Facultatif
            </UBadge>
          </div>
          <p class="text-sm text-muted">
            {{ request.teamRequest ? "Un dépôt par équipe" : "Dépôt individuel" }}
            <span v-if="request.teamRequest && !participant.team"> · Rejoignez une équipe pour déposer</span>
          </p>
          <p class="text-sm" :class="dayjs(now).isBefore(request.deadline) ? 'text-muted' : 'text-warning'">
            {{ dayjs(now).isBefore(request.deadline) ? "À remettre avant le" : "Échéance dépassée depuis le" }}
            {{ formatDate(request.deadline, "D MMMM à HH[h]mm") }}
          </p>
        </div>
      </li>
    </ul>
    <div v-else class="p-4 sm:p-6">
      <UAlert color="success" variant="soft" icon="i-lucide-circle-check" title="Tout est complété"
              description="Vous pouvez consulter vos réponses depuis le dépôt."/>
    </div>

    <template v-if="requests?.length && status !== 'error'" #footer>
      <p class="text-sm text-muted">
        {{ requests.length - pendingRequests.length }} / {{ requests.length }} dépôts complétés
        <span v-if="pendingRequests.length > 4"> · {{ pendingRequests.length }} restants</span>
      </p>
    </template>
  </UCard>
</template>
