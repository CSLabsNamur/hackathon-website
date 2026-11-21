<script setup lang="ts">
import { AdminTeamsEditModal } from "#components";

definePageMeta({
  layout: {
    name: "user-dashboard",
    props: {
      title: "Mon équipe",
    },
  },
  middleware: "participant-auth",
  requiredPermissions: ["teams.read.own"],
});

const {status, data: currentParticipant, refresh: refreshCurrentParticipant} = await useCurrentParticipant();
const team = computed(() => currentParticipant.value?.team);

const {can, canPermission} = useAbility(currentParticipant);
const canUpdateOwnTeam = computed(() => can("updateOwn", "Team"));
const {setActions} = useDashboardNavbar();
const overlay = useOverlay();

const editTeamModal = overlay.create(AdminTeamsEditModal);

const openEditTeamModal = async () => {
  if (!team.value || !canUpdateOwnTeam.value) return;

  const result = await editTeamModal.open({team: team.value});
  if (result) await refreshCurrentParticipant();
};

setActions(computed(() => team.value ? [{
  icon: "i-lucide-edit-2",
  label: "Modifier",
  disabled: !canUpdateOwnTeam.value,
  onClick: openEditTeamModal,
}] : []));
</script>

<template>
  <UContainer class="grid gap-6 max-w-7xl">
    <UAlert v-if="status === 'error'" color="error" variant="soft" icon="i-lucide-circle-alert"
            title="Impossible de charger votre équipe"
            :actions="[{label: 'Réessayer', color: 'error', variant: 'soft', onClick: () => refreshCurrentParticipant()}]"/>

    <div v-else-if="!currentParticipant" class="grid gap-6">
      <USkeleton class="h-20 w-full"/>
      <div class="grid gap-6 lg:grid-cols-3">
        <USkeleton class="h-80 lg:col-span-2"/>
        <USkeleton class="h-56"/>
      </div>
    </div>

    <ParticipantNoTeamCTA v-else-if="!team"/>

    <template v-else>
      <header class="grid gap-2">
        <h1 class="text-2xl font-semibold text-highlighted wrap-anywhere">{{ team.name }}</h1>
        <p v-if="team.description" class="text-sm text-muted whitespace-pre-line wrap-anywhere">
          {{ team.description }}
        </p>
        <p v-if="team.room" class="flex items-start gap-2 text-sm text-muted">
          <UIcon name="i-lucide-map-pin" class="mt-0.5 size-4"/>
          <span class="wrap-anywhere">
            Salle attribuée · <span class="font-medium text-highlighted">{{ team.room.name }}</span>
          </span>
        </p>
      </header>

      <div class="grid items-start gap-6 lg:grid-cols-3">
        <ParticipantTeamMembersCard :members="team.members" class="lg:col-span-2"/>
        <div class="grid gap-6">
          <ParticipantTeamInviteCard :token="team.token"/>
          <ParticipantTeamStatusCard :key="canPermission('submissionRequests.read') ? 'full' : 'basic'"
                                     :participant="currentParticipant"/>
        </div>
      </div>
    </template>
  </UContainer>
</template>
