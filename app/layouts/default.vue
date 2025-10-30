<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import type { ConditionalNavigationMenuItem } from "~/components/ConditionalNavigationMenu.vue";
import type { ButtonProps } from "#ui/components/Button.vue";

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
  {
    label: "Panels",
    condition: import.meta.dev,
    children: [{
      label: "Admin Panel",
      to: "/admin",
      icon: "i-lucide-shield-check",
      active: route.path.startsWith("/admin"),
    }, {
      label: "Participant Panel",
      to: "/participant",
      icon: "i-lucide-user-2",
      active: route.path.startsWith("/participant"),
    }],
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

type FooterLogos = ButtonProps & { ariaLabel: string };

// TODO: Add ability to update links globally (settings page?)
const footerLogos: FooterLogos[] = [{
  icon: "i-simple-icons-discord",
  to: "https://discord.gg/Jf2Dht8",
  ariaLabel: "Discord",
}, {
  icon: "i-simple-icons-github",
  to: "https://github.com/CSLabsNamur",
  ariaLabel: "GitHub",
}, {
  icon: "i-simple-icons-linkedin",
  to: "https://www.linkedin.com/company/cslabs-namur",
  ariaLabel: "LinkedIn",
}, {
  icon: "i-simple-icons-instagram",
  to: "https://www.instagram.com/cslabs_namur/",
  ariaLabel: "Instagram",
}];
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

  <UFooter class="mt-4">
    <template #left>
      <span class="text-muted text-sm">Publié sous
        <a href="https://opensource.org/license/bsd-3-clause" target="_blank"
           class="text-highlighted">Licence BSD-3</a>
      </span>
    </template>

    <UNavigationMenu :items="footerItems"/>

    <template #right>
      <UButton v-for="logo in footerLogos" :key="logo.ariaLabel" :icon="logo.icon" :to="logo.to" :target="logo.target"
               variant="ghost" color="neutral" :aria-label="logo.ariaLabel"/>
    </template>
  </UFooter>
</template>

<style scoped>
#logo {
  font-family: "Zing Rust", sans-serif;
  font-size: 32px;
}
</style>
