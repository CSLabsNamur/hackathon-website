<script setup lang="ts">
import type { TimelineItem } from "@nuxt/ui";

const timeline: TimelineItem[] = [
  {
    date: "26-28 Octobre 2018",
    title: "1ère édition – Smart Rurality",
    icon: "i-lucide-ev-charger",
    description: "Lancement du tout premier Hackathon ! Le thème est la 'Smart Rurality' : imaginer et créer des services innovants pour le citoyen des zones rurales. 60 participants.",
  },
  {
    date: "18-20 Octobre 2019",
    title: "2e édition – Hope for Climate",
    icon: "i-lucide-sun-snow",
    description: "Deuxième édition du Hackathon, avec pour thème 'Hope for Climate' : développer des solutions technologiques pour lutter contre le changement climatique.",
  },
  {
    date: "18-20 Février 2022",
    title: "3e édition – Le Bien Vieillir",
    icon: "i-lucide-heart-pulse",
    //icon: "i-lucide-rocking-chair",
    description: "Après 3 reports dus à la pandémie, le Hackathon revient avec le thème 'Le Bien Vieillir' : concevoir des innovations pour améliorer la qualité de vie des personnes âgées. 60 participants.",
  },
  {
    date: "17-19 Février 2023",
    title: "4e édition – Le Handicap",
    icon: "i-lucide-accessibility",
    description: "Le Hackathon continue avec le thème 'Le Handicap' : imaginer des solutions pour faciliter la vie quotidienne des personnes en situation de handicap.",
  },
  {
    date: "16-18 Février 2024",
    title: "5e édition – L'Enseignement",
    icon: "i-lucide-school",
    description: "Le Hackathon continue avec le thème 'L'Enseignement' : imaginer des solutions pour transformer et améliorer les méthodes d'enseignement.",
  },
  {
    date: "28 Février - 2 Mars 2025",
    title: "6e édition – La Culture",
    icon: "i-lucide-book-open",
    description: "Le thème de cette édition est 'La Culture' : développer des projets qui favorisent l'accès, la diffusion et la préservation de la culture sous toutes ses formes.",
  },
  {
    date: "27-29 Mars 2026",
    title: "7e édition – À venir",
    icon: "i-lucide-moon-star",
    description: "Le thème de la prochaine édition sera annoncé prochainement. Restez à l'écoute pour plus d'informations !",
  },
];

const pictures = [
  "/images/history/CSLabs-Hackathon-2025-14.jpg",
  "/images/history/CSLabs-Hackathon-2025-82.jpg",
  "/images/history/P1037840.jpg",
  "/images/history/P1037897.jpg",
  "/images/history/P1037987.jpg",
  "/images/history/P1038039.jpg",
  "/images/history/P1038100.jpg",
  "/images/history/P1038103.jpg",
  "/images/history/P1038328.jpg",
  "/images/history/P1038360.jpg",
]
</script>

<template>
  <UPageHero :ui="{container: 'max-w-full !px-0'}">
    <PageHero title="Historique" subtitle="Retour sur les éditions précédentes !">
    </PageHero>
  </UPageHero>

  <UContainer class="max-w-[80vw]">
    <div class="flex flex-col md:flex-row items-center justify-between">
      <UTimeline :items="timeline" orientation="vertical" :default-value="5" class="md:w-2xl"/>
      <UCarousel v-slot="{ item }" :items="pictures" loop autoplay class="md:w-2xl">
        <NuxtImg :src="item" alt="Photo d'une édition précédente" sizes="700px" class="rounded-lg"/>
      </UCarousel>
    </div>
  </UContainer>
</template>
