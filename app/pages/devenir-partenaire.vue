<script setup lang="ts">
const {data: settings} = await useSettings();

useSeoMeta({
  title: "Devenir partenaire",
  description: "Envie de soutenir l’événement ? Contactez l’équipe et découvrons ensemble la formule qui vous convient.",
});
</script>

<template>
  <UPageHero :ui="{container: 'max-w-full !px-0'}">
    <PageHero title="Devenir partenaire"
              subtitle="Envie de soutenir l’événement ? Contactez l’équipe et découvrons ensemble la formule qui vous convient."
              :images="[{ name: 'CSLabs', logo: '/images/logo-cslabs.png', url: 'https://cslabs.be' }]"/>
  </UPageHero>

  <UContainer class="py-10">
    <UCard class="mx-auto max-w-3xl">
      <template #header>
        <h2 class="text-xl font-semibold">Contact</h2>
        <p class="text-sm text-muted mt-1">Écrivez-nous, on vous répond rapidement.</p>
      </template>

      <div v-if="settings" class="space-y-3">
        <p>
          Email :
          <a class="text-primary underline" :href="`mailto:${settings.website.contactEmail}`">
            {{ settings.website.contactEmail }}
          </a>
        </p>
        <p class="text-sm text-muted">
          Indiquez votre organisation, votre point de contact et ce que vous aimeriez apporter (lots, mentors, présence
          sur place, etc.).
        </p>
      </div>
      <div v-else class="space-y-3">
        <p class="text-sm text-muted">
          Les coordonnées de contact ne peuvent pas être chargées pour le moment. Merci de réessayer un peu plus tard.
        </p>
      </div>
    </UCard>
  </UContainer>
</template>
