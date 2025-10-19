<script setup lang="ts">
import type { AvatarProps } from "#ui/components/Avatar.vue";
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";

defineProps<{
  user: {
    name: string,
    description?: string,
    avatar: Omit<AvatarProps, "size"> & { [key: string]: any; }
  },
  collapsed?: boolean
}>();

const items: DropdownMenuItem[][] = [[{
  label: "Profile",
  icon: "i-lucide-user-circle",
  to: "/profile",
}, {
  label: "Settings",
  icon: "i-lucide-settings",
  to: "/settings",
}, {
  label: "Logout",
  icon: "i-lucide-log-out",
  to: "/logout",
}]];
</script>

<template>
  <UDropdownMenu :content="{align: 'center'}" :items>
    <UUser v-if="!collapsed" :name="user.name" :description="user.description" :avatar="user.avatar"/>
    <UUser v-else :avatar="user.avatar"/>
  </UDropdownMenu>
</template>
