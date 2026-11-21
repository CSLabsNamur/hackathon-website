<script setup lang="ts">
definePageMeta({
  layout: {
    name: "user-dashboard",
    props: {
      title: "Accueil",
    },
  },
  middleware: "participant-auth",
});

const [
  {status, data: currentParticipant, refresh: refreshCurrentParticipant},
  {status: settingsStatus, data: settings, refresh: refreshSettings},
] = await Promise.all([useCurrentParticipant(), useSettings()]);

const now = useNow();
const event = computed(() => settings.value?.event);
const {data: eventPhaseData} = await useEventPhase();
const arrivalAlert = computed(() => getParticipantArrivalAlert(eventPhaseData.value));

const {canPermissions} = useAbility(currentParticipant);
const canReadSubmissions = computed(() => canPermissions(["submissionRequests.read", "submissions.read.own"]));
const canReadTeam = computed(() => canPermissions(["teams.read.own"]));
const canReadProfile = computed(() => canPermissions(["participants.read.own"]));

const eventPhase = computed(() => {
  if (!event.value) return null;
  if (eventPhaseData.value === EventPhase.PREPARATION) return {label: "À venir", color: "neutral" as const};
  if (eventPhaseData.value === EventPhase.ONGOING) return {label: "En cours", color: "success" as const};
  return {label: "Terminé", color: "neutral" as const};
});

useRefreshOnPageReturn(refreshSettings);
</script>

<template>
  <UContainer class="grid gap-6 max-w-7xl">
    <UAlert v-if="status === 'error'" color="error" variant="soft" icon="i-lucide-circle-alert"
            title="Impossible de charger votre espace participant"
            :actions="[{label: 'Réessayer', color: 'error', variant: 'soft', onClick: () => refreshCurrentParticipant()}]"/>

    <div v-else-if="!currentParticipant" class="grid gap-6">
      <USkeleton class="h-20 w-full"/>
      <div class="grid gap-6 lg:grid-cols-3">
        <USkeleton class="h-96 lg:col-span-2"/>
        <USkeleton class="h-64"/>
      </div>
    </div>

    <template v-else>
      <header class="grid gap-4 sm:gap-2">
        <UAlert v-if="!currentParticipant.checkedInAt && arrivalAlert" v-bind="arrivalAlert"
                variant="soft" icon="i-lucide-alert-circle"/>
        <h1 class="text-2xl font-semibold text-highlighted wrap-anywhere">
          Bonjour, {{ currentParticipant.user.firstName }}
        </h1>
        <div v-if="event" class="flex items-center gap-x-2 gap-y-1 text-sm text-muted">
          <p class="text-sm text-muted wrap-anywhere">
            {{ event.title }} · {{ formatDateRange(event.startDate, event.endDate, false) }}
          </p>
          <UBadge v-if="eventPhase" :color="eventPhase.color" variant="subtle">
            {{ eventPhase.label }}
          </UBadge>
        </div>
      </header>

      <UAlert v-if="settingsStatus === 'error'" color="error" variant="soft" icon="i-lucide-circle-alert"
              title="Impossible de charger les informations de l'événement"
              :actions="[{label: 'Réessayer', color: 'error', variant: 'soft', onClick: () => refreshSettings()}]"/>

      <UAlert v-if="currentParticipant.caution === CautionStatus.NOT_PAID && canReadProfile"
              color="warning" variant="soft" icon="i-lucide-wallet" title="Caution à régler"
              :description="event?.cautionAmount ? `Retrouvez les informations de paiement des ${event.cautionAmount}€ sur votre profil.` : undefined"
              :actions="[{label: 'Voir le paiement', to: '/participant/profile', color: 'warning', variant: 'soft'}]"/>

      <div class="grid items-start gap-6 lg:grid-cols-3">
        <div class="min-w-0 grid gap-6 lg:col-span-2">
          <ParticipantDashboardScheduleCard :now/>
          <ParticipantDashboardSubmissionsCard v-if="canReadSubmissions" :participant="currentParticipant" :now/>
        </div>
        <div class="min-w-0 grid gap-6">
          <ParticipantDashboardTeamCard v-if="canReadTeam" :participant="currentParticipant"
                                        @refresh="refreshCurrentParticipant"/>
          <ParticipantDashboardEventCard v-if="settings"/>
        </div>
      </div>
    </template>
  </UContainer>
</template>
