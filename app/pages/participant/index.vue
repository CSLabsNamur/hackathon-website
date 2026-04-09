<script setup lang="ts">
definePageMeta({
  layout: {
    name: "user-dashboard",
    props: {
      title: "Accueil",
    },
  },
  middleware: "participant-auth",
});
</script>

<template>
  <UContainer class="grid place-items-center h-full">
    <UPageSection title="Bienvenue sur votre tableau de bord"
                  description="Utilisez le menu de navigation pour accéder aux différentes sections."
                  icon="i-lucide-rocket"/>
  </UContainer>
</template>
