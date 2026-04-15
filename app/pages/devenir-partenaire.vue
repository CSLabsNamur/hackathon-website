<script setup lang="ts">
import type { PageFeatureProps } from "#ui/components/PageFeature.vue";

const {data: settings} = await useSettings();

const benefits: PageFeatureProps[] = [
  {
    title: "Visibilité ciblée",
    icon: "i-lucide-megaphone",
    description: "Associez votre structure à un événement étudiant local et tourné vers l'innovation.",
  },
  {
    title: "Format flexible",
    icon: "i-lucide-sliders-horizontal",
    description: "Mentorat, nourriture, jury, lots; nous construisons un partenariat adapté à vos contraintes et à ce que vous souhaitez apporter.",
  },
];

useSeoMeta({
  title: "Devenir partenaire",
  description: "Envie de soutenir l’événement ? Contactez l’équipe et découvrons ensemble la formule qui vous convient.",
});
</script>

<template>
  <UPageHero :ui="{container: 'max-w-full !px-0'}">
    <PageHero size="medium" title="Devenir partenaire"
              subtitle="Envie de soutenir l'événement ? Contactez l'équipe et découvrons ensemble la formule qui vous convient."/>
  </UPageHero>

  <UContainer class="py-10">
    <UPageSection title="Pourquoi nous rejoindre ?"
                  description="Le but n'est pas d'empiler des logos, mais de construire une présence cohérente et utile pour les participants."
                  :features="benefits" :ui="{container: '!pt-0 !pb-8', features: 'grid grid-cols-2 lg:grid-cols-2'}"/>

    <div class="flex justify-center mt-10">
      <UCard class="max-w-3xl">
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
            Indiquez votre organisation, votre point de contact et ce que vous aimeriez apporter (lots, mentors,
            présence
            sur place, etc.).
          </p>
        </div>
        <div v-else class="space-y-3">
          <p class="text-sm text-muted">
            Les coordonnées de contact ne peuvent pas être chargées pour le moment. Merci de réessayer un peu plus tard.
          </p>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>
