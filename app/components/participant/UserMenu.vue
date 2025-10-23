<script setup lang="ts">
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";

defineProps<{
  participant: Participant;
  collapsed?: boolean
}>();

const items: DropdownMenuItem[][] = [[{
  label: "Profil",
  icon: "i-lucide-user-circle",
  to: "/participant/profile",
}, {
  label: "Paramètres",
  icon: "i-lucide-settings",
  to: "/settings",
}, {
  label: "Se déconnecter",
  icon: "i-lucide-log-out",
  to: "/logout",
}]];
</script>

<template>
  <UDropdownMenu :content="{align: 'center'}" :items>
    <UUser v-if="!collapsed" :name="`${participant.firstName} ${participant.lastName}`"
           :description="participant.email"
           :avatar="{src: `https://github.com/${participant.githubAccount}.png`}"/>
    <UUser v-else :avatar="{src: `https://github.com/${participant.githubAccount}.png`}"/>
  </UDropdownMenu>
</template>
