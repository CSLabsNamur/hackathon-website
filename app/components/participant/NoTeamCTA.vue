<script setup lang="ts">
import type { ButtonProps } from "@nuxt/ui";
import { ParticipantCreateTeamModal, ParticipantJoinTeamModal } from "#components";

const overlay = useOverlay();
const createModal = overlay.create(ParticipantCreateTeamModal);
const joinModal = overlay.create(ParticipantJoinTeamModal);

const {data: currentParticipant, refresh: refreshCurrentParticipant} = await useCurrentParticipant();
const {refresh: refreshTeams} = await useTeams({lazy: true});
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
        await Promise.all([refreshCurrentParticipant(), refreshTeams()]);
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
        await Promise.all([refreshCurrentParticipant(), refreshTeams()]);
      }
    },
  },
]);
</script>

<template>
  <UPageCTA title="Vous n'avez pas encore d'équipe !"
            description="Créez ou rejoignez une équipe pour participer aux compétitions." :links/>
</template>
