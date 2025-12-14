<script setup lang="ts">
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";

const props = defineProps<{
  participant: Participant;
  collapsed?: boolean;
}>();

const avatarUrl = computed(() => {
  const seed = encodeURIComponent(`${props.participant.user.firstName} ${props.participant.user.lastName}`);
  return `https://api.dicebear.com/6.x/initials/svg?seed=${seed}`;
});

const items: DropdownMenuItem[][] = [[{
  label: "Profil",
  icon: "i-lucide-user-circle",
  to: "/participant/profile",
},
//  {
//  label: "Paramètres",
//  icon: "i-lucide-settings",
//  to: "/settings",
//},
  {
    label: "Se déconnecter",
    icon: "i-lucide-log-out",
    to: "/auth/logout",
  }]];
</script>

<template>
  <UDropdownMenu :content="{align: 'center'}" :items>
    <UUser v-if="!collapsed" :name="`${participant.user.firstName} ${participant.user.lastName}`"
           :description="participant.user.email" :avatar="{ src: avatarUrl }"/>
    <UUser v-else :avatar="{ src: avatarUrl }"/>
  </UDropdownMenu>
</template>
