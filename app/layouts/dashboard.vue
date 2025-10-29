<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();
const toast = useToast();
const {eventTitle} = useRuntimeConfig().public;

const colorMode = useColorMode();
const theme = computed(() => colorMode.value === "dark" ? "dark" : "default");
provide(THEME_KEY, theme);

const open = ref(false);

const links: NavigationMenuItem[][] = [[{
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
  label: "Diffusions",
  icon: "i-lucide-send",
  to: "/admin/broadcast",
  onSelect: () => {
    open.value = false;
  },
}, {
  label: "Soumissions",
  icon: "i-lucide-file-text",
  to: "/admin/submissions",
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
}], [{
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
]];

const groups = [{
  id: "links",
  label: "Aller vers",
  items: links.flat(),
}];
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

<style scoped>
* {
  --ui-container: 90rem;
}
</style>
