<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
  middleware: "admin-auth",
});

const {data: currentAdmin, status: currentAdminStatus} = await useCurrentAdmin();
const {can} = useAbility(currentAdmin);

const canReadParticipants = computed(() => can("read", "Participant"));
const canReadTeams = computed(() => can("read", "Team"));

const hasVisibleOverview = computed(() => canReadParticipants.value || canReadTeams.value);
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <DashboardNavbar title="Accueil"/>
    </template>
    <template #body>
      <UContainer>
        <div class="flex flex-col gap-6 lg:gap-8">
          <div v-if="currentAdminStatus === 'success' && hasVisibleOverview" class="space-y-px">
            <AdminParticipantStats v-if="canReadParticipants"
                                   :rounded="!canReadTeams"
                                   :class="canReadTeams ? '*:first:rounded-tl-lg *:last:rounded-tr-lg' : undefined"/>
            <AdminTeamStats v-if="canReadTeams"
                            :rounded="!canReadParticipants"
                            :include-participant-derived-stats="canReadParticipants"
                            :class="canReadParticipants ? '*:first:rounded-bl-lg *:last:rounded-br-lg' : undefined"/>
          </div>
          <UPageGrid v-if="currentAdminStatus === 'success' && canReadParticipants" class="lg:flex">
            <AdminChartsRegistrationTimeline class="w-2/3"/>
            <AdminChartsTeamFormation class="w-1/3"/>
          </UPageGrid>
          <UPageCard v-if="currentAdminStatus === 'success' && !hasVisibleOverview" title="Aucune statistique visible"
                     description="Votre rôle ne donne accès à aucun indicateur sur cette page. Utilisez le menu pour accéder aux sections autorisées."
                     icon="i-lucide-lock"/>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
