<script setup lang="ts">
import { AdminTeamsEditModal, AdminTeamsRemoveModal, RemoveTeamMemberModal } from "#components";

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

const {canPermission} = useAbility(currentParticipant);
const {setActions} = useDashboardNavbar();
const overlay = useOverlay();

const editTeamModal = overlay.create(AdminTeamsEditModal);
const removeMemberModal = overlay.create(RemoveTeamMemberModal);
const disbandTeamModal = overlay.create(AdminTeamsRemoveModal);

const isCaptain = computed(() => Boolean(team.value && team.value.captainId === currentParticipant.value?.id));
const canUpdateOwnTeam = computed(() => isCaptain.value && canPermission("teams.update.own"));
const canRemoveMembers = computed(() => isCaptain.value && canPermission("teams.members.remove.own"));
const canDisbandTeam = computed(() => Boolean(team.value && isCaptain.value && canPermission("teams.delete.own") && team.value.members.every((member) => member.id === team.value?.captainId)));

const openEditTeamModal = async () => {
  if (!team.value || !canUpdateOwnTeam.value) return;

  const result = await editTeamModal.open({team: team.value});
  if (result) await refreshCurrentParticipant();
};

const openRemoveMemberModal = async (member: CurrentParticipantTeamMember) => {
  if (!team.value || !canRemoveMembers.value) return;

  const result = await removeMemberModal.open({teamId: team.value.id, participant: member});
  if (result) await refreshCurrentParticipant();
};

const openDisbandTeamModal = async () => {
  if (!team.value || !canDisbandTeam.value) return;

  const result = await disbandTeamModal.open({team: team.value, ownTeam: true});
  if (result) await refreshCurrentParticipant();
};

setActions(computed(() => [
  ...(canUpdateOwnTeam.value ? [{icon: "i-lucide-edit-2", label: "Modifier", onClick: openEditTeamModal}] : []),
  ...(canDisbandTeam.value ? [{icon: "i-lucide-trash-2", label: "Dissoudre", onClick: openDisbandTeamModal}] : []),
]));
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
        <ParticipantTeamMembersCard :members="team.members" :captain-id="team.captainId"
                                    :can-remove-members="canRemoveMembers" class="lg:col-span-2"
                                    @remove="openRemoveMemberModal"/>
        <div class="grid gap-6">
          <ParticipantTeamInviteCard :token="team.token"/>
          <ParticipantTeamStatusCard :key="canPermission('submissionRequests.read') ? 'full' : 'basic'"
                                     :participant="currentParticipant"/>
        </div>
      </div>
    </template>
  </UContainer>
</template>
