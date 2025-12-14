<script setup lang="ts">
import type { TimelineItem } from "@nuxt/ui";

const timeline: TimelineItem[] = [
  {
    date: "26-28 Octobre 2018",
    title: "1ère édition – Smart Rurality",
    icon: "i-lucide-ev-charger",
    description: "Lancement du tout premier Hackathon ! Le thème est la 'Smart Rurality' : imaginer et créer des services innovants pour le citoyen des zones rurales. L'objectif est de provoquer une réflexion sur l'intégration des TIC dans les zones moins urbanisées.",
  },
  {
    date: "18-20 Octobre 2019",
    title: "2e édition – Hope for Climate",
    icon: "i-lucide-sun-snow",
    description: "Pour la seconde édition, le Climat est mis à l'honneur. *Comment inciter au recyclage, développer le transport en commun, ou encore réduire la consommation énergétique ?*",
  },
  {
    date: "18-20 Février 2022",
    title: "3e édition – Le Bien Vieillir",
    icon: "i-lucide-heart-pulse",
    //icon: "i-lucide-rocking-chair",
    description: "Après 2 reports dus à la pandémie, le Hackathon 'Le Bien Vieillir' s'organise, dans le cadre du 50e anniversaire de la Faculté d'Informatique de l'Université de Namur.\nL'idée : *Repenser la technologie pour tous*, en imaginant des solutions pour aider les personnes âgées à mieux appréhender les technologies modernes.",
  },
  {
    date: "17-19 Février 2023",
    title: "4e édition – Le Handicap",
    icon: "i-lucide-accessibility",
    description: "Le Hackathon continue autour de la thématique du Handicap ! Le monde actuel n'est pas toujours adapté à tout le monde. L'objectif est de trouver des moyens pour faire face à des problèmes réels que rencontrent les personnes en situation de handicap au quotidien.",
  },
  {
    date: "16-18 Février 2024",
    title: "5e édition – L'Enseignement",
    icon: "i-lucide-school",
    description: "En 2024, c'est au tour de l'Enseignement d'être mis en avant. Mot clef : Modernité. Le but est de créer des outils et méthodes pour rendre l'enseignement plus interactif et adapté aux besoins des enfants d'aujourd'hui.",
  },
  {
    date: "28 Février - 2 Mars 2025",
    title: "6e édition – La Culture",
    icon: "i-lucide-book-open",
    description: "Namur candidate pour devenir capitale européenne de la culture... Alors évidemment, on en a profité ! Les participants développeront leurs idées autour de cette grande question : *comment l'informatique peut-elle contribuer à la promotion et la préservation du patrimoine culturel ?*",
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
];
</script>

<template>
  <UPageHero :ui="{container: 'max-w-full !px-0'}">
    <PageHero title="Historique" subtitle="Retour sur les éditions précédentes !">
    </PageHero>
  </UPageHero>

  <UContainer class="max-w-[80vw]">
    <div class="flex flex-col md:flex-row items-center justify-between">
      <UTimeline :items="timeline" orientation="vertical" :default-value="5" class="md:w-2xl">
        <template #description="{item}">
          <MDC v-if="item.description" :value="item.description" unwrap class="whitespace-pre-line"/>
        </template>
      </UTimeline>
      <UCarousel v-slot="{ item }" :items="pictures" loop autoplay class="md:w-2xl">
        <NuxtImg :src="item" alt="Photo d'une édition précédente" sizes="700px" class="rounded-lg"/>
      </UCarousel>
    </div>
  </UContainer>
</template>
