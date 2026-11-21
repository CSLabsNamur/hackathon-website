<script setup lang="ts">
definePageMeta({
  layout: {
    name: "user-dashboard",
    props: {
      title: "Aide & infos pratiques",
    },
  },
  middleware: "participant-auth",
});

const [{data: settings, status, refresh}] = await Promise.all([useSettings({lazy: true}), useCurrentParticipant()]);

const contactEmail = computed(() => settings.value?.website.contactEmail?.trim());
const bugReportEmail = computed(() => settings.value?.website.bugReportEmail?.trim());
const discordLink = computed(() => settings.value?.socialLinks.find((link) => link.type === "DISCORD" && link.url));

useRefreshOnPageReturn(refresh);
</script>

<template>
  <UContainer class="grid gap-6 max-w-7xl">
    <header>
      <h1 class="text-2xl font-semibold text-highlighted">Aide & infos pratiques</h1>
    </header>

    <UAlert v-if="status === 'error'" color="error" variant="soft" icon="i-lucide-circle-alert"
            title="Impossible de charger les contacts"
            :actions="[{label: 'Réessayer', color: 'error', variant: 'soft', onClick: () => refresh()}]"/>

    <div v-else-if="!settings" class="grid gap-6 lg:grid-cols-2">
      <USkeleton v-for="n in 2" :key="n" class="h-48"/>
    </div>

    <div v-else-if="contactEmail || discordLink || bugReportEmail" class="grid gap-6 lg:grid-cols-2">
      <UCard v-if="contactEmail || discordLink">
        <template #header>
          <h2 class="text-lg font-semibold text-highlighted">Contacter l'organisation</h2>
        </template>
        <div class="grid gap-4">
          <p class="text-sm text-muted">
            Pour une question sur votre venue ou le déroulement de l'événement.
          </p>
          <div class="flex flex-wrap gap-3">
            <UButton v-if="contactEmail" :to="`mailto:${contactEmail}`" color="neutral" variant="soft"
                     icon="i-lucide-mail">
              {{ contactEmail }}
            </UButton>
            <UButton v-if="discordLink" :to="discordLink.url" :icon="discordLink.icon" target="_blank" color="neutral"
                     variant="soft">
              {{ discordLink.label }}
            </UButton>
          </div>
        </div>
      </UCard>

      <UCard v-if="bugReportEmail">
        <template #header>
          <h2 class="text-lg font-semibold text-highlighted">Signaler un problème technique</h2>
        </template>
        <div class="grid gap-4">
          <p class="text-sm text-muted">
            Indiquez la page concernée, les étapes suivies et le message d'erreur rencontré.
          </p>
          <UButton :to="`mailto:${bugReportEmail}`" color="neutral" variant="soft"
                   icon="i-lucide-bug" class="max-w-full place-self-start">
            <span class="min-w-0 whitespace-normal wrap-anywhere">{{ bugReportEmail }}</span>
          </UButton>
        </div>
      </UCard>
    </div>

    <UEmpty v-else title="Aucun contact publié" icon="i-lucide-mail"
            description="Les coordonnées de l'organisation apparaîtront ici dès leur publication."/>

    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold text-highlighted">Liens utiles</h2>
      </template>
      <div class="grid gap-6 sm:grid-cols-2">
        <div class="grid gap-3">
          <h3 class="font-medium text-highlighted">Préparer votre arrivée</h3>
          <p class="text-sm text-muted">Retrouvez l'adresse, les accès et les informations pratiques.</p>
          <UButton to="/infos" variant="link" trailing-icon="i-lucide-arrow-right" class="p-0 place-self-start">
            Accès et détails
          </UButton>
        </div>

        <div class="grid gap-3">
          <h3 class="font-medium text-highlighted">Conditions de participation</h3>
          <p class="text-sm text-muted">Consultez les termes et conditions de l'événement.</p>
          <UButton to="/documents/termes_et_conditions.pdf" target="_blank" external variant="link"
                   trailing-icon="i-lucide-external-link" class="p-0 place-self-start">
            Lire les conditions
          </UButton>
        </div>
      </div>
    </UCard>
  </UContainer>
</template>
