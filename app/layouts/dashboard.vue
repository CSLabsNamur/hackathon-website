<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();
const toast = useToast();
const {eventTitle} = useRuntimeConfig().public;

const open = ref(false);

const links: NavigationMenuItem[][] = [[{
  label: "Accueil",
  icon: "i-lucide-house",
  to: "/admin",
  onSelect: () => {
    open.value = false;
  },
}, {
  label: "Équipes",
  icon: "i-lucide-users",
  to: "/admin/teams",
  onSelect: () => {
    open.value = false;
  },
}, {
  label: "Utilisateurs",
  icon: "i-lucide-user-check",
  to: "/admin/users",
  onSelect: () => {
    open.value = false;
  },
}, {
  label: "Diffusions",
  icon: "i-lucide-send",
  to: "/admin/broadcast",
  onSelect: () => {
    open.value = false;
  },
}], [{
  label: "Retour au site",
  icon: "i-lucide-arrow-left-circle",
  to: "/",
  onSelect: () => {
    open.value = false;
  },
}, {
  label: "Aide & Support",
  icon: "i-lucide-life-buoy",
  to: "/support",
  onSelect: () => {
    open.value = false;
  },
}]];

const groups = [{
  id: "links",
  label: "Aller vers",
  items: links.flat(),
}];
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar collapsible resizable class="bg-elevated/25" :ui="{footer: 'lg:border-t lg:border-default'}">
      <template #header="{collapsed}">
        <span v-if="!collapsed" class="text-muted">{{ eventTitle }}</span>
      </template>

      <template #default="{collapsed}">
        <UDashboardSearchButton :collapsed class="bg-transparent ring-default"/>

        <UNavigationMenu :collapsed :items="links[0]" orientation="vertical" tooltip popover/>
        <UNavigationMenu :collapsed :items="links[1]" orientation="vertical" tooltip class="mt-auto"/>
      </template>

      <template #footer="{collapsed}">
        <AdminUserMenu :user="adminUser" :collapsed/>
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups/>

    <slot/>
  </UDashboardGroup>
</template>
