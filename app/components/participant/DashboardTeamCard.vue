<script setup lang="ts">
import { ParticipantCreateTeamModal, ParticipantJoinTeamModal } from "#components";

const props = defineProps<{ participant: CurrentParticipant }>();
const emit = defineEmits<{ refresh: [] }>();

const {can, canPermissions} = useAbility(() => props.participant);
const {copyWithToast} = useCopyWithToast();
const overlay = useOverlay();

const createModal = overlay.create(ParticipantCreateTeamModal);
const joinModal = overlay.create(ParticipantJoinTeamModal);

const teamIssues = computed(() => props.participant.team ? getTeamValidationIssues(props.participant.team) : []);

const openCreateModal = async () => {
  if (!can("createOwn", "Team")) return;
  if (await createModal.open()) emit("refresh");
};
const openJoinModal = async () => {
  if (!can("join", "Team")) return;
  if (await joinModal.open()) emit("refresh");
};

const copyToken = () => {
  if (!props.participant.team) return;
  copyWithToast(props.participant.team.token, {title: "Code d'invitation copié"});
};
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-lg font-semibold text-highlighted">Mon équipe</h2>
        <UButton v-if="participant.team" to="/participant/team" color="neutral" variant="ghost" size="sm"
                 trailing-icon="i-lucide-arrow-right"/>
        <UButton v-else-if="canPermissions(['teams.read'])" to="/participant/teams" size="sm"
                 color="neutral" variant="ghost" trailing-icon="i-lucide-arrow-right"/>
      </div>
    </template>

    <div v-if="participant.team" class="grid gap-4">
      <div>
        <h3 class="font-semibold text-highlighted wrap-anywhere">{{ participant.team.name }}</h3>
        <p class="text-sm text-muted">
          {{ participant.team.members.length }} membre{{ participant.team.members.length > 1 ? "s" : "" }}
        </p>
      </div>
      <p v-if="participant.team.room" class="flex items-start gap-2 text-sm text-muted">
        <UIcon name="i-lucide-map-pin" class="mt-0.5 size-4 shrink-0"/>
        <span class="min-w-0 wrap-anywhere">
          Salle attribuée · <span class="font-medium text-highlighted">{{ participant.team.room.name }}</span>
        </span>
      </p>
      <ul class="grid gap-2">
        <li v-for="member in participant.team.members" :key="member.id" class="flex items-center gap-2">
          <UAvatar :alt="`${member.user.firstName} ${member.user.lastName}`" size="xs"/>
          <span class="min-w-0 text-sm wrap-break-word">
            {{ member.user.firstName }} {{ member.user.lastName }}
          </span>
        </li>
      </ul>
      <UAlert v-for="issue in teamIssues" :key="issue.code" color="warning" variant="soft"
              icon="i-lucide-circle-alert" :title="issue.message"/>
      <UButton class="place-self-start" color="neutral" variant="soft" icon="i-lucide-copy" size="sm"
               @click="copyToken">
        Copier le code d'invitation
      </UButton>
    </div>
    <div v-else class="grid gap-4">
      <p class="text-sm text-muted">
        Créez ou rejoignez une équipe pour participer. Il faut au moins {{ TEAM_MINIMUM_MEMBERS }} membres.
      </p>
      <div class="flex flex-wrap gap-2">
        <UButton icon="i-lucide-plus" :disabled="!can('createOwn', 'Team')" @click="openCreateModal">
          Créer
        </UButton>
        <UButton color="neutral" variant="soft" icon="i-lucide-user-plus"
                 :disabled="!can('join', 'Team')" @click="openJoinModal">
          Rejoindre
        </UButton>
      </div>
    </div>

    <template #footer>
      <UButton v-if="participant.team" to="/participant/team" color="neutral" variant="link"
               trailing-icon="i-lucide-arrow-right" class="p-0">
        Voir mon équipe
      </UButton>
      <UButton v-else-if="canPermissions(['teams.read'])" to="/participant/teams"
               color="neutral" variant="link" trailing-icon="i-lucide-arrow-right" class="p-0">
        Découvrir les équipes
      </UButton>
    </template>
  </UCard>
</template>
