<script setup lang="ts">
import type { ButtonProps } from "@nuxt/ui";
import { ParticipantCreateTeamModal, ParticipantJoinTeamModal } from "#components";

const overlay = useOverlay();
const createModal = overlay.create(ParticipantCreateTeamModal);
const joinModal = overlay.create(ParticipantJoinTeamModal);

const {data: currentParticipant, refresh: refreshCurrentParticipant} = await useCurrentParticipant();
const {can} = useAbility(currentParticipant);

const links = computed<ButtonProps[]>(() => [
  {
    label: "Créer une équipe",
    color: "primary",
    disabled: !can("createOwn", "Team"),
    onClick: async () => {
      if (!can("createOwn", "Team")) return;

      const result = await createModal.open();
      if (result) {
        await refreshCurrentParticipant();
        if (can("read", "Team")) await refreshNuxtData("participant-team-directory");
      }
    },
  },
  {
    label: "Rejoindre une équipe",
    color: "secondary",
    disabled: !can("join", "Team"),
    onClick: async () => {
      if (!can("join", "Team")) return;

      const result = await joinModal.open();
      if (result) {
        await refreshCurrentParticipant();
        if (can("read", "Team")) await refreshNuxtData("participant-team-directory");
      }
    },
  },
]);
</script>

<template>
  <UCard>
    <UEmpty title="Vous n'avez pas encore d'équipe" icon="i-lucide-users" class="border-0"
            :description="`Créez ou rejoignez une équipe pour participer. Il faut au moins ${TEAM_MINIMUM_MEMBERS} membres.`"
            :actions="links"/>
  </UCard>
</template>
