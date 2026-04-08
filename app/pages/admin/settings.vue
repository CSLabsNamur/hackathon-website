<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

definePageMeta({
  layout: "dashboard",
  middleware: "admin-auth",
  requiredPermissions: ["settings.read"],
});

const links = [
  {
    label: "Site",
    icon: "i-lucide-globe",
    to: "/admin/settings",
    exact: true,
  }, {
    label: "Événement",
    icon: "i-lucide-calendar-days",
    to: "/admin/settings/event",
  }, {
    label: "Inscriptions",
    icon: "i-lucide-clipboard-check",
    to: "/admin/settings/registrations",
  }, {
    label: "Réseaux sociaux",
    icon: "i-lucide-share-2",
    to: "/admin/settings/socials",
  },
] satisfies NavigationMenuItem[];
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <DashboardNavbar title="Paramètres"/>
      <UDashboardToolbar>
        <UNavigationMenu :items="links" highlight/>
      </UDashboardToolbar>
    </template>

    <template #body>
      <UContainer>
        <NuxtPage/>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
