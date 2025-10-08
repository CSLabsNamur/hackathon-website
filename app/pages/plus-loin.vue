<script setup lang="ts">
import type { PageFeatureProps } from "#ui/components/PageFeature.vue";
import type { ButtonProps } from "#ui/components/Button.vue";

const features: PageFeatureProps[] = [
  {
    title: "Accompagnement personnalisé",
    icon: "i-lucide-rocket",
    description: "Du coaching personnalisé, des ateliers, des expertises pointues... Tu n'es pas seul(e) !",
  },
  {
    title: "Réseau de partenaires",
    icon: "i-lucide-users",
    description: "Le TRAKK, c'est 3 partenaires complémentaires : le KIKK, l'UNamur et le BEP – chacun avec son réseau et ses expertises.",
  },
  {
    title: "Espaces de travail à disposition",
    icon: "i-lucide-layers",
    description: "En tant qu'étudiant, tu auras accès à tous les services du TRAKK : salles de réunion, bureaux, FabLab, ... et le plaisir d'être tous ensemble !",
  },
];

const links: ButtonProps[] = [
  {
    label: "On en discute ?",
    to: "https://www.trakk.be/services/linkube/",
    icon: "i-lucide-external-link",
    color: "neutral",
    external: true,
    target: "_blank",
    trailing: true
  },
];
</script>

<template>
  <UPageHero :ui="{container: 'max-w-full !px-0'}">
    <PageHero title="Aller plus loin" subtitle="Un avenir pour ton projet"
              content="Ton projet peut changer les choses.
                       N'hésite pas à aller consulter nos sponsors pour lui construire un avenir !">
    </PageHero>
  </UPageHero>

  <UPageSection title="Le TRAKK | LinKube" headline="Toutes tes idées ont un avenir !" :features :links
                :ui="{container: '!pt-0'}"
  >
    <template #description>
      <p>Étudiant ou jeune diplômé plein d’idée ? La niak d’entreprendre et de mener un projet de A jusque Z ?</p>
      <p>Tu as envie d’oser, expérimenter, entreprendre, innover de façon plus créative ?</p>
      <p>Un chemin de possibles s'offre à toi pour concrétiser tes beaux projets.</p>
    </template>

    <div class="flex justify-center">
      <NuxtImg src="/images/partenaires/TRAKK-Namur.jpg" alt="Le TRAKK" sizes="400px lg:600px xl:800px"
               class="rounded-lg shadow-lg"/>
    </div>
  </UPageSection>
</template>
