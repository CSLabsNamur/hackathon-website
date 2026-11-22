<script setup lang="ts">
import { fr } from "@nuxt/ui/locale";

const nuxtApp = useNuxtApp();
nuxtApp.hooks.hookOnce("app:manifest:update", () => {
  const toast = useToast();
  toast.add({
    title: "Nouvelle version disponible",
    description: "Une nouvelle version de l'application est disponible. Veuillez actualiser la page.",
    color: "info",
    duration: 0,
    actions: [{
      label: "Actualiser",
      icon: "i-lucide-refresh-cw",
      onClick: () => {
        window.location.reload();
      },
    }],
  });
});
</script>

<template>
  <UApp :locale="fr">
    <NuxtLoadingIndicator/>
    <NuxtRouteAnnouncer/>

    <NuxtLayout>
      <NuxtPage/>
    </NuxtLayout>
  </UApp>
</template>

<style>
@media (prefers-reduced-motion: no-preference) {
  .layout-enter-active {
    transition: opacity 160ms ease-out;
  }

  .layout-leave-active {
    transition: opacity 80ms ease-in;
  }

  .layout-enter-from,
  .layout-leave-to {
    opacity: 0;
  }
}
</style>
