<script setup lang="ts">
definePageMeta({
  layout: {
    name: "dashboard",
    props: {
      title: "Accueil",
    },
  },
  middleware: "admin-auth",
});

const {data: currentAdmin, status: currentAdminStatus} = await useCurrentAdmin();
const {data: eventPhase, refresh: refreshSettings} = await useEventPhase();
const {can} = useAbility(currentAdmin);

const canReadParticipants = computed(() => can("read", "Participant"));
const canReadTeams = computed(() => can("read", "Team"));
const hasVisibleOverview = computed(() => canReadParticipants.value || canReadTeams.value);

const {
  data: participants,
  status: participantsStatus,
  refresh: refreshParticipants,
} = await useParticipants({lazy: true, immediate: false});
const cautionBreakdown = computed(() => getCautionBreakdown(participants.value ?? []));
const hasParticipantCharts = computed(() => canReadParticipants.value && !!participants.value && participantsStatus.value !== "error");

useRefreshOnPageReturn(() => {
  refreshSettings();
  if (canReadParticipants.value) return refreshParticipants();
});
</script>

<template>
  <UContainer>
    <div class="flex flex-col gap-6 lg:gap-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <h1 class="text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
          Vue d'ensemble
        </h1>
        <UBadge v-if="eventPhase" :label="eventPhase" variant="subtle" icon="i-lucide-calendar-days" size="lg"/>
      </div>

      <template v-if="currentAdminStatus === 'success'">
        <AdminParticipantStats v-if="canReadParticipants" links/>
        <AdminChartsRegistrationTimeline v-if="hasParticipantCharts && participants" :participants="participants"/>
        <div v-if="hasParticipantCharts || canReadTeams" class="grid items-start gap-6"
             :class="hasParticipantCharts && canReadTeams ? 'lg:grid-cols-2' : undefined">
          <AdminChartsCautions v-if="hasParticipantCharts && participants" :breakdown="cautionBreakdown"
                               :total="participants.length"/>
          <AdminChartsTeamSizes v-if="canReadTeams" :include-participant-stats="canReadParticipants"/>
        </div>
        <UPageCard v-if="!hasVisibleOverview" title="Aucune statistique visible" icon="i-lucide-lock"/>
      </template>

      <UAlert v-else-if="currentAdminStatus === 'error'" color="error" variant="subtle"
              title="Le tableau de bord est indisponible." icon="i-lucide-circle-alert"/>

      <USkeleton v-else class="h-64 rounded-xl"/>
    </div>
  </UContainer>
</template>
