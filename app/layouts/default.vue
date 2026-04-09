<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import type { NavigationMenuItem } from "@nuxt/ui";
import type { ConditionalNavigationMenuItem } from "~/components/ConditionalNavigationMenu.vue";
import type { ButtonProps } from "#ui/components/Button.vue";

const supabaseClient = useSupabaseClient();
const user = useSupabaseUser();
const {data: settings, status: settingsStatus} = await useSettings();
const {data: currentUser, refresh: refreshCurrentUser, clear: clearCurrentUser} = await useCurrentUser({
  immediate: false,
  lazy: true,
  server: false,
});

const overlay = useOverlay();
const LoginModal = defineAsyncComponent(() => import("~/components/LoginModal.vue"));
const loginModal = overlay.create(LoginModal);
const showSettingsWarning = computed(() => settingsStatus.value === "error");

const headerItems = computed<ConditionalNavigationMenuItem[]>(() => [
  {
    label: "Inscription",
    to: "/inscription",
    condition: settings.value?.event.teaserEnabled !== true,
  },
  {
    label: "Partenaires",
    to: "/partenaires",
    condition: settings.value?.event.teaserEnabled !== true,
  },
  {
    label: "Infos",
    to: "/infos",
    condition: settings.value?.event.teaserEnabled !== true,
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
    condition: currentUser.value?.kind === "admin",
    to: "/admin",
    icon: "i-lucide-shield",
  },
  {
    label: "Panel Participant",
    condition: currentUser.value?.kind === "participant",
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

const footerLogos = computed<FooterLogos[]>(() => settings.value?.socialLinks.map((link) => ({
  icon: link.icon,
  to: link.url,
  target: "_blank",
  ariaLabel: link.label,
})) ?? []);

watch(user, async (newUser) => {
  if (newUser) {
    await refreshCurrentUser();
  } else {
    clearCurrentUser();
  }
}, {immediate: true});
</script>

<template>
  <UHeader mode="modal">
    <template #title>
      <span id="logo">Hackathon</span>
    </template>

    <ConditionalNavigationMenu :items="headerItems"/>

    <template #right>
      <UColorModeButton class="-mr-2">
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
    <UContainer v-if="showSettingsWarning" class="pt-4">
      <LazyUAlert color="warning" variant="soft" icon="i-lucide-triangle-alert"
              title="Informations temporairement indisponibles"
              description="Le site reste accessible, mais certaines informations liées à l'événement ne peuvent pas être chargées pour le moment."/>
    </UContainer>
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
