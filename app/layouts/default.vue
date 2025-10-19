<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import type { ConditionalNavigationMenuItem } from "~/components/ConditionalNavigationMenu.vue";

const route = useRoute();
const {teaserEnabled} = useRuntimeConfig().public;

const headerItems = computed<ConditionalNavigationMenuItem[]>(() => [
  {
    label: "Inscription",
    to: "/inscription",
    active: route.path.startsWith("/inscription"),
    condition: !teaserEnabled,
  },
  {
    label: "Partenaires",
    to: "/partenaires",
    active: route.path.startsWith("/partenaires"),
    condition: !teaserEnabled,
  },
  {
    label: "Infos",
    to: "/infos",
    active: route.path.startsWith("/infos"),
    condition: !teaserEnabled,
  },
  {
    label: "Historique",
    to: "/historique",
    active: route.path.startsWith("/historique"),
  },
  {
    label: "Plus loin",
    to: "/plus-loin",
    active: route.path.startsWith("/plus-loin"),
  },
]);

const footerItems = computed<NavigationMenuItem[]>(() => [
  {
    label: "❤️ CSLabs",
    to: "https://cslabs.be",
    target: "_blank",
  },
  {
    label: "Termes et conditions",
    to: "/documents/termes_et_conditions.pdf",
    target: "_blank",

  },
  {
    label: "Politique de cookies",
    to: "/cookie-policy",
    active: route.path.startsWith("/cookie-policy"),
  },
]);
</script>

<template>
  <UHeader mode="modal">
    <template #title>
      <span id="logo">Hackathon</span>
    </template>

    <ConditionalNavigationMenu :items="headerItems"/>

    <template #right>
      <UColorModeButton>
        <template #fallback>
          <UButton loading variant="ghost" color="neutral"/>
        </template>
      </UColorModeButton>
    </template>

    <template #body>
      <UNavigationMenu :items="headerItems" orientation="vertical" class="-mx-2.5"/>
    </template>
  </UHeader>

  <UMain>
    <slot/>
  </UMain>

  <UFooter>
    <UNavigationMenu :items="footerItems"/>
  </UFooter>
</template>

<style scoped>
#logo {
  font-family: "Zing Rust", sans-serif;
  font-size: 32px;
}
</style>
