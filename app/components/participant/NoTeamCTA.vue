<script setup lang="ts">
import type { ButtonProps } from "@nuxt/ui";
import { ParticipantCreateTeamModal, ParticipantJoinTeamModal } from "#components";

const overlay = useOverlay();
const createModal = overlay.create(ParticipantCreateTeamModal);
const joinModal = overlay.create(ParticipantJoinTeamModal);

const links: ButtonProps[] = [
  {
    label: "Créer une équipe",
    color: "primary",
    onClick: () => {
      createModal.open();
    },
  },
  {
    label: "Rejoindre une équipe",
    color: "secondary",
    onClick: () => {
      joinModal.open();
    },
  },
];
</script>

<template>
  <UPageCTA title="Vous n'avez pas encore d'équipe !"
            description="Créez ou rejoignez une équipe pour participer aux compétitions." :links/>
</template>
