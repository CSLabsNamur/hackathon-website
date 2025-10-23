<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();
const toast = useToast();
const {eventTitle} = useRuntimeConfig().public;

const open = ref(false);

const links: NavigationMenuItem[][] = [[{
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
  onSelect: () => {
    open.value = false;
  },
  children: [
    {
      label: "Autres équipes",
      icon: "i-lucide-users",
      to: "/participant/teams",
      onSelect: () => {
        open.value = false;
      },
    },
  ],
}, {
  label: "Mon profil",
  icon: "i-lucide-user-circle",
  to: "/participant/profile",
  onSelect: () => {
    open.value = false;
  },
}, {
  label: "Dépôt",
  icon: "i-lucide-send",
  to: "/participant/submit",
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
  to: "/participant/support",
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
        <div class="mx-auto">
          <NuxtLink to="/participant">
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
        <ParticipantUserMenu :participant="currentParticipant" :collapsed/>
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
