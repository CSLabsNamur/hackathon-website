<script setup lang="ts">
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";

const props = defineProps<{
  participant: CurrentParticipant;
  collapsed?: boolean;
}>();

const avatarUrl = computed(() => getAvatarUrl(props.participant));

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
