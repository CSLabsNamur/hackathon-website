<script setup lang="ts">
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";

const props = defineProps<{
  admin: Admin;
  collapsed?: boolean
}>();

const avatarUrl = computed(() => {
  const seed = encodeURIComponent(`${props.admin.user.firstName} ${props.admin.user.lastName}`);
  return `https://api.dicebear.com/6.x/initials/svg?seed=${seed}`;
});

const items: DropdownMenuItem[][] = [[
//  {
//  label: "Paramètres",
//  icon: "i-lucide-settings",
//  to: "/settings",
//},
  {
    label: "Se déconnecter",
    icon: "i-lucide-log-out",
    to: "/logout",
  }]];
</script>

<template>
  <UDropdownMenu :content="{align: 'center'}" :items>
    <UUser
        v-if="!collapsed"
        :name="`${admin.user.firstName} ${admin.user.lastName}`"
        :description="admin.user.email"
        :avatar="{ src: avatarUrl }"
    />
    <UUser v-else :avatar="{ src: avatarUrl }"/>
  </UDropdownMenu>
</template>
