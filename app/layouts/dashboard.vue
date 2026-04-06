<script setup lang="ts">
import type { CommandPaletteGroup, CommandPaletteItem, NavigationMenuItem } from "@nuxt/ui";
import RestrictedNavigationMenu, { type RestrictedNavigationItem } from "~/components/RestrictedNavigationMenu.vue";

const {data: currentAdmin} = await useCurrentAdmin();

const colorMode = useColorMode();
// Provide theme to echarts components
const theme = computed(() => colorMode.value === "dark" ? "dark" : "default");
provide(THEME_KEY, theme);

const open = ref(false);

const topLinks: RestrictedNavigationItem[] = [
  {
    label: "Accueil",
    icon: "i-lucide-house",
    to: "/admin",
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "Participants",
    icon: "i-lucide-user-check",
    to: "/admin/participants",
    requiredPermissions: ["participants.read"],
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "Équipes",
    icon: "i-lucide-users",
    to: "/admin/teams",
    requiredPermissions: ["teams.read", "participants.read"],
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "Invités",
    icon: "i-lucide-id-card",
    to: "/admin/guests",
    requiredPermissions: ["guests.read"],
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "Sponsors",
    icon: "i-lucide-handshake",
    to: "/admin/sponsors",
    requiredPermissions: ["sponsors.read"],
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "Diffusions",
    icon: "i-lucide-send",
    to: "/admin/broadcast",
    requiredPermissions: ["broadcasts.send"],
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "Soumissions",
    icon: "i-lucide-file-text",
    to: "/admin/submissions-requests",
    requiredPermissions: ["submissionRequests.read", "participants.read"],
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "Salles",
    icon: "i-lucide-door-open",
    to: "/admin/rooms",
    requiredPermissions: ["rooms.read", "teams.read"],
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "Impressions",
    icon: "i-lucide-printer",
    to: "/admin/prints",
    requiredPermissions: ["badges.print", "participants.read", "guests.read", "admins.read"],
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "Administrateurs",
    icon: "i-lucide-shield-plus",
    to: "/admin/admins",
    requiredPermissions: ["admins.read", "roles.read"],
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "Rôles",
    icon: "i-lucide-shield-user",
    to: "/admin/roles",
    requiredPermissions: ["roles.read"],
    onSelect: () => {
      open.value = false;
    },
  },
];

const bottomLinks: NavigationMenuItem[] = [
  {
    label: "Retour au site",
    icon: "i-lucide-arrow-left-circle",
    to: "/",
    onSelect: () => {
      open.value = false;
    },
  },
//{
//  label: "Aide & Support",
//  icon: "i-lucide-life-buoy",
//  to: "/admin/support",
//  onSelect: () => {
//    open.value = false;
//  },
//}
];

const navigationGroups = computed<CommandPaletteGroup<CommandPaletteItem>[]>(() => [{
  id: "links",
  label: "Aller vers",
  items: topLinks.flat() as CommandPaletteItem[],
}]);
const {searchTerm, groups, loading} = useAdminSearch(navigationGroups);
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar collapsible resizable class="bg-elevated/25" :ui="{footer: 'lg:border-t lg:border-default'}">
      <template #header>
        <div class="mx-auto">
          <NuxtLink to="/admin">
            <NuxtImg src="/images/logo-vide.png" alt="Logo Hackathon" sizes="64px"/>
          </NuxtLink>
        </div>
      </template>

      <template #default="{collapsed}">
        <UDashboardSearchButton :collapsed class="bg-transparent ring-default"/>

        <RestrictedNavigationMenu :collapsed :items="topLinks" :user="currentAdmin"/>
        <RestrictedNavigationMenu :collapsed :items="bottomLinks" :user="currentAdmin" class="mt-auto"/>
      </template>

      <template #footer="{collapsed}">
        <USkeleton v-if="!currentAdmin" :width="collapsed ? '2.5rem' : '100%'" :height="collapsed ? '2.5rem' : '3rem'"
                   class="mx-auto rounded"/>
        <AdminUserMenu v-else :admin="currentAdmin" :collapsed/>
      </template>
    </UDashboardSidebar>

    <UDashboardSearch v-model:search-term="searchTerm" :groups :loading/>

    <slot/>
  </UDashboardGroup>
</template>

<style scoped>
* {
  --ui-container: 90rem;
}
</style>
