<script setup lang="ts">
import type { CommandPaletteGroup, CommandPaletteItem, NavigationMenuItem } from "@nuxt/ui";

const {data: adminUser} = await useCurrentAdmin();

const colorMode = useColorMode();
// Provide theme to echarts components
const theme = computed(() => colorMode.value === "dark" ? "dark" : "default");
provide(THEME_KEY, theme);

const open = ref(false);

const topLinks: NavigationMenuItem[][] = [
  [{
    label: "Accueil",
    icon: "i-lucide-house",
    to: "/admin",
    onSelect: () => {
      open.value = false;
    },
  }, {
    label: "Participants",
    icon: "i-lucide-user-check",
    to: "/admin/participants",
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
    label: "Invités",
    icon: "i-lucide-id-card",
    to: "/admin/guests",
    onSelect: () => {
      open.value = false;
    },
  }, {
    label: "Sponsors",
    icon: "i-lucide-handshake",
    to: "/admin/sponsors",
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
  }, {
    label: "Soumissions",
    icon: "i-lucide-file-text",
    to: "/admin/submissions-requests",
    onSelect: () => {
      open.value = false;
    },
  }, {
    label: "Salles",
    icon: "i-lucide-door-open",
    to: "/admin/rooms",
    onSelect: () => {
      open.value = false;
    },
  }, {
    label: "Impressions",
    icon: "i-lucide-printer",
    to: "/admin/prints",
    onSelect: () => {
      open.value = false;
    },
  }, {
    label: "Administrateurs",
    icon: "i-lucide-shield-plus",
    to: "/admin/admins",
    onSelect: () => {
      open.value = false;
    },
  }, {
    label: "Rôles",
    icon: "i-lucide-shield-user",
    to: "/admin/roles",
    onSelect: () => {
      open.value = false;
    },
  }],
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

const navigationGroups: CommandPaletteGroup<CommandPaletteItem>[] = [{
  id: "links",
  label: "Aller vers",
  items: topLinks.flat() as CommandPaletteItem[],
}];
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

        <UNavigationMenu :collapsed :items="topLinks" orientation="vertical" tooltip popover/>
        <UNavigationMenu :collapsed :items="bottomLinks" orientation="vertical" tooltip class="mt-auto"/>
      </template>

      <template #footer="{collapsed}">
        <USkeleton v-if="!adminUser" :width="collapsed ? '2.5rem' : '100%'" :height="collapsed ? '2.5rem' : '3rem'"
                   class="mx-auto rounded"/>
        <AdminUserMenu v-else :admin="adminUser" :collapsed/>
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
