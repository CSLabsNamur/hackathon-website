<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import type { ConditionalNavigationMenuItem } from "~/components/ConditionalNavigationMenu.vue";
import type { ButtonProps } from "#ui/components/Button.vue";
import LoginModal from "~/components/LoginModal.vue";

const {teaserEnabled} = useRuntimeConfig().public;

const supabaseClient = useSupabaseClient();
const user = useSupabaseUser();

const overlay = useOverlay();
const loginModal = overlay.create(LoginModal);

const headerItems = computed<ConditionalNavigationMenuItem[]>(() => [
  {
    label: "Inscription",
    to: "/inscription",
    condition: !teaserEnabled,
  },
  {
    label: "Partenaires",
    to: "/partenaires",
    condition: !teaserEnabled,
  },
  {
    label: "Infos",
    to: "/infos",
    condition: !teaserEnabled,
  },
  {
    label: "Historique",
    to: "/historique",
  },
  {
    label: "Plus loin",
    to: "/plus-loin",
  },
  {
    label: "Panel Admin",
    condition: user.value?.user_metadata?.role === "admin",
    to: "/admin",
    icon: "i-lucide-shield",
  },
  {
    label: "Panel Participant",
    condition: user.value?.user_metadata?.role === "participant",
    to: "/participant",
    icon: "i-lucide-user",
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

//watchEffect(() => {
//  console.log("User changed:", user.value);
//});
</script>

<template>
  <UHeader mode="modal">
    <template #title>
      <span id="logo">Hackathon</span>
    </template>

    <ConditionalNavigationMenu :items="headerItems"/>

    <template #right>
      <UColorModeButton :ui="{base: 'p-0'}">
        <template #fallback>
          <UButton loading variant="ghost" color="neutral"/>
        </template>
      </UColorModeButton>
      <USeparator orientation="vertical" class="h-6 mx-2"/>
      <UButton v-if="!user" variant="soft" @click="loginModal.open()">Connexion</UButton>
      <UButton v-else variant="soft" @click="supabaseClient.auth.signOut()">Déconnexion</UButton>
    </template>

    <template #body>
      <ConditionalNavigationMenu :items="headerItems" orientation="vertical" class="-mx-2.5"/>
    </template>
  </UHeader>

  <UMain>
    <slot/>
  </UMain>

  <UFooter class="mt-4">
    <template #left>
      <span class="text-muted text-sm">
        <a href="https://github.com/CSLabsNamur/hackathon-website" target="_blank"
           class="text-highlighted">Publié</a> sous
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
