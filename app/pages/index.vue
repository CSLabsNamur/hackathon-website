<script setup lang="ts">
import type { PageFeatureProps } from "#ui/components/PageFeature.vue";
import { formatDateRange } from "~/utils/datetime";

const organizers: Partner[] = [
  {
    name: "CSLabs",
    logo: "/images/logo-cslabs.png",
    url: "https://cslabs.be",
  },
  {
    name: "UNamur",
    logo: "/images/partenaires/unamur.png",
    url: "https://unamur.be",
  },
];

const prix: PageFeatureProps[] = [
  {
    title: "Prix de l'innovation",
    icon: "i-lucide-lightbulb",
    description: "Récompense le projet le plus innovant et original, mettant en avant des idées nouvelles et créatives.",
  },
  {
    title: "Prix de la technique",
    icon: "i-lucide-microscope",
    description: "Décerné à l'équipe avec la réalisation technique la plus aboutie, démontrant des compétences avancées en développement et en ingénierie.",
  },
  {
    title: "Prix du public",
    icon: "i-lucide-thumbs-up",
    description: "Attribué au projet qui a reçu le plus de votes du public, reflétant l'impact et l'attrait général de l'idée auprès des participants.",
  },
];

const {teaserEnabled, eventTitle, eventSlogan, eventDateStart, eventDateEnd} = useRuntimeConfig().public;
</script>

<template>
  <UPageHero :ui="{container: 'max-w-full !px-0'}">
    <PageHero v-if="teaserEnabled"
              title="Le Hackathon se prépare !"
              :subtitle="`Notez déjà la date ${formatDateRange(eventDateStart, eventDateEnd, true, false)} dans vos agendas !`"
              :images="organizers"/>
    <PageHero v-else
              :title="eventTitle" :subtitle="eventSlogan"
              :content="formatDateRange(eventDateStart, eventDateEnd, true, true)"
              :images="organizers"/>
  </UPageHero>

  <UContainer>
    <UPageSection title="Qu'est-ce qu'un hackathon ?" orientation="horizontal" :ui="{container: '!pt-0'}">
      <template #description>
        Un Hackathon est un moment de courte durée où des équipes réfléchissent à une thématique particulière. Elles
        tentent d'y apporter des solutions en développant des projets innovants. À la fin de l'évènement, un jury
        détermine quels sont les projets qui ont retenu leur attention et qui ont donc gagné la compétition.
      </template>

      <div class="flex justify-center">
        <NuxtImg src="/images/presentation/hackathon_irl.jpg" alt="Ordinateur d'un participants en plein Hackathon"
                 sizes="400px lg:600px xl:800px"
                 class="rounded-lg shadow-lg"/>
      </div>
    </UPageSection>

    <UPageSection title="Qui peut participer ?" orientation="horizontal" :reverse="true" :ui="{container: '!pt-12'}">
      <template #description>
        Notre Hackathon est ouvert à tous et à toutes !
        Aucune compétence spécifique n'est requise pour participer, ce qui permet à chacun d'apporter sa créativité et
        ses idées. L'important est d'avoir envie de participer et de relever le défi !
      </template>

      <div class="flex justify-center">
        <NuxtImg src="/images/presentation/edition.jpg" alt="Groupe d'étudiants en plein Hackathon"
                 sizes="400px lg:600px xl:800px"
                 class="rounded-lg shadow-lg"/>
      </div>
    </UPageSection>

    <UPageSection title="Que gagner ?" orientation="horizontal" :features="prix" :ui="{container: '!pt-12'}">
      <template #description>
        En plus de la satisfaction d'avoir relevé le défi, les participants pourront tenter de remporter
        un de nos prix ! Chaque prix met en avant une qualité particulière, que ce soit l'innovation, la technique
        ou encore la popularité auprès du public.
      </template>

      <div class="flex justify-center">
        <NuxtImg src="/images/presentation/prizes.jpg" alt="Trophées du Hackathon 2025"
                 sizes="400px lg:600px xl:800px"
                 class="rounded-lg shadow-lg"/>
      </div>
    </UPageSection>

    <UPageSection title="Qui sommes-nous ?" orientation="horizontal" :reverse="true" :ui="{container: '!pt-12'}">
      <template #description>
        <p>
          Ce Hackathon est organisé par le CSLabs, la
          <NuxtLink to="https://www.junior-enterprises.be/" external target="_blank">Junior Entreprise</NuxtLink>
          de la Faculté d'Informatique de
          <NuxtLink to="https://www.unamur.be/fr" external target="_blank">l'Université de Namur</NuxtLink>
          .
        </p>
        <p class="mt-2">
          Nous organisons régulièrement des formations, workshops et autres événements pour permettre aux étudiants
          d'apprendre et de se développer dans l'informatique.
        </p>
        <p class="text-toned mt-2">
          <span class="font-semibold">Notre mission :</span> "Offrir l'opportunité aux étudiants d'entreprendre dans le
          domaine de l'informatique".
        </p>
      </template>

      <div class="flex justify-center">
        <NuxtImg src="/images/presentation/cslabs_formation.jpg" alt="Photo d'une formation du CSLabs"
                 sizes="400px lg:600px xl:800px"
                 class="rounded-lg shadow-lg"/>
      </div>
    </UPageSection>

    <UPageSection :ui="{container: 'px-0 !py-4 sm:!py-6 lg:!py-8'}">
      <RegisterCTA/>
    </UPageSection>
  </UContainer>
</template>
