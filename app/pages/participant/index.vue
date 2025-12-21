<script setup lang="ts">
definePageMeta({
  layout: "user-dashboard",
  middleware: "participant-auth",
});
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <DashboardNavbar title="Accueil"/>
    </template>
    <template #body>
      <UContainer class="grid place-items-center h-full">
        <UPageSection title="Bienvenue sur votre tableau de bord"
                   description="Utilisez le menu de navigation pour accéder aux différentes sections."
                   icon="i-lucide-rocket"/>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
