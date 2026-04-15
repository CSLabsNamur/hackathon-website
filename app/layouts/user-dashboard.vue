<script setup lang="ts">
import type { CommandPaletteGroup, CommandPaletteItem } from "@nuxt/ui";
import RestrictedNavigationMenu, { type RestrictedNavigationItem } from "~/components/RestrictedNavigationMenu.vue";

withDefaults(defineProps<{
  title?: string;
}>(), {
  title: "Tableau de bord",
});

const {data: currentParticipant, status, refresh: refreshCurrentParticipant} = await useCurrentParticipant();
const {data: settings} = await useSettings({lazy: true});
const {canPermissions} = useAbility(currentParticipant);
const {actions} = useDashboardNavbar();

useRefreshOnPageReturn(refreshCurrentParticipant);

const open = ref(false);
const dashboardLogoUrl = computed(() => settings.value?.event.logoUrl ?? "/images/logo-vide.png");

const links: RestrictedNavigationItem[][] = [[{
  label: "Accueil",
  icon: "i-lucide-house",
  to: "/participant",
  onSelect: () => {
    open.value = false;
  },
}, {
  label: "Mon équipe",
  icon: "i-lucide-user-check",
  to: "/participant/team",
  requiredPermissions: ["teams.read.own"],
  onSelect: () => {
    open.value = false;
  },
  children: [
    {
      label: "Autres équipes",
      icon: "i-lucide-users",
      to: "/participant/teams",
      requiredPermissions: ["teams.read"],
      onSelect: () => {
        open.value = false;
      },
    },
  ],
}, {
  label: "Mon profil",
  icon: "i-lucide-user-circle",
  to: "/participant/profile",
  requiredPermissions: ["participants.read.own"],
  onSelect: () => {
    open.value = false;
  },
}, {
  label: "Dépôt",
  icon: "i-lucide-send",
  to: "/participant/submit",
  requiredPermissions: ["submissionRequests.read", "submissions.read.own"],
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
},
//  {
//  label: "Aide & Support",
//  icon: "i-lucide-life-buoy",
//  to: "/participant/support",
//  onSelect: () => {
//    open.value = false;
//  },
//}
]];

// TODO: reused logic between dashboards and RestrictedNavigationMenu, abstract this
const filterRestrictedNavigationItems = (items: RestrictedNavigationItem[]): RestrictedNavigationItem[] => items
    .filter((item) => canPermissions(item.requiredPermissions))
    .map((item) => ({
      ...item,
      children: item.children ? filterRestrictedNavigationItems(item.children) : undefined,
    }));

const searchableLinks = computed(() => links.map((group) => filterRestrictedNavigationItems(group)));

const groups = computed<CommandPaletteGroup<CommandPaletteItem>[]>(() => [{
  id: "links",
  label: "Aller vers",
  items: searchableLinks.value.flat() as CommandPaletteItem[],
}]);
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar collapsible resizable class="bg-elevated/25" :ui="{footer: 'lg:border-t lg:border-default'}">
      <template #header>
        <div class="mx-auto">
          <NuxtLink to="/participant">
            <img :src="dashboardLogoUrl" alt="Logo Hackathon" class="size-16 object-contain">
          </NuxtLink>
        </div>
      </template>

      <template #default="{collapsed}">
        <UDashboardSearchButton :collapsed class="bg-transparent ring-default"/>

        <RestrictedNavigationMenu :collapsed :items="links[0]" orientation="vertical" tooltip popover
                                  :user="currentParticipant"/>
        <RestrictedNavigationMenu :collapsed :items="links[1]" orientation="vertical" tooltip :user="currentParticipant"
                                  class="mt-auto"/>
      </template>

      <template #footer="{collapsed}">
        <div v-if="!currentParticipant" class="py-2 text-center">
          <!-- TODO: error handling -->
          Error
        </div>
        <ParticipantUserMenu v-else :participant="currentParticipant" :loading="status !== 'success'" :collapsed/>
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups/>

    <UDashboardPanel>
      <template #header>
        <DashboardNavbar :title>
          <template #right>
            <UButton v-for="(action, index) in actions" :key="`navbar-action-${index}`" v-bind="action"/>
          </template>
        </DashboardNavbar>
      </template>
      <template #body>
        <slot/>
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>

<style scoped>
* {
  --ui-container: 90rem;
}
</style>
