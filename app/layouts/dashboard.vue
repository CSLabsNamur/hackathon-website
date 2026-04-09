<script setup lang="ts">
import type { CommandPaletteGroup, CommandPaletteItem, NavigationMenuItem } from "@nuxt/ui";
import RestrictedNavigationMenu, { type RestrictedNavigationItem } from "~/components/RestrictedNavigationMenu.vue";

withDefaults(defineProps<{
  title?: string;
}>(), {
  title: "Tableau de bord",
});

const {data: currentAdmin} = await useCurrentAdmin();
const {data: settings} = await useSettings({lazy: true});
const {canPermissions} = useAbility(currentAdmin);

const colorMode = useColorMode();
// Provide theme to echarts components
const theme = computed(() => colorMode.value === "dark" ? "dark" : "default");
provide(THEME_KEY, theme);

const open = ref(false);
const dashboardLogoUrl = computed(() => settings.value?.event.logoUrl ?? "/images/logo-vide.png");

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
    requiredPermissions: ["badges.print", "participants.read", "guests.read", "sponsors.read", "admins.read"],
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
  {
    label: "Paramètres",
    icon: "i-lucide-settings",
    to: "/admin/settings",
    requiredPermissions: ["settings.read"],
    defaultOpen: true,
    type: "trigger",
    onSelect: () => {
      open.value = false;
    },
    children: [
      {
        label: "Site",
        icon: "i-lucide-globe",
        to: "/admin/settings",
        exact: true,
        requiredPermissions: ["settings.read"],
        onSelect: () => {
          open.value = false;
        },
      }, {
        label: "Événement",
        icon: "i-lucide-calendar-days",
        to: "/admin/settings/event",
        requiredPermissions: ["settings.read"],
        onSelect: () => {
          open.value = false;
        },
      }, {
        label: "Inscriptions",
        icon: "i-lucide-clipboard-check",
        to: "/admin/settings/registrations",
        requiredPermissions: ["settings.read"],
        onSelect: () => {
          open.value = false;
        },
      }, {
        label: "Réseaux sociaux",
        icon: "i-lucide-share-2",
        to: "/admin/settings/socials",
        requiredPermissions: ["settings.read"],
        onSelect: () => {
          open.value = false;
        },
      },
    ],
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

const searchableTopLinks = computed(() => topLinks.filter((item) => canPermissions(item.requiredPermissions)));

function getSearchableNavigationItems(items: RestrictedNavigationItem[], parentLabel?: string): CommandPaletteItem[] {
  return items.flatMap((item) => {
    if (!canPermissions(item.requiredPermissions)) {
      return [];
    }

    const {children, requiredPermissions: _requiredPermissions, ...commandItem} = item;
    const label = parentLabel ? `${parentLabel} · ${item.label}` : item.label;
    const currentItem = commandItem.to ? [{...commandItem, label} satisfies CommandPaletteItem] : [];
    const childItems = children ? getSearchableNavigationItems(children, item.label) : [];

    return [...currentItem, ...childItems];
  });
}

const navigationGroups = computed<CommandPaletteGroup<CommandPaletteItem>[]>(() => [{
  id: "links",
  label: "Aller vers",
  items: getSearchableNavigationItems(searchableTopLinks.value),
}]);
const {searchTerm, groups, loading} = useAdminSearch(navigationGroups);

const {actions} = useDashboardNavbar();
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar collapsible resizable class="bg-elevated/25" :ui="{footer: 'lg:border-t lg:border-default'}">
      <template #header>
        <div class="mx-auto">
          <NuxtLink to="/admin">
            <img :src="dashboardLogoUrl" alt="Logo Hackathon" class="size-16 object-contain">
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
