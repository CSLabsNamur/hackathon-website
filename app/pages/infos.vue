<script setup lang="ts">
import type { TimelineItem } from "@nuxt/ui";
import type { PageFeatureProps } from "#ui/components/PageFeature.vue";

const {copy} = useClipboard();
const toast = useToast();
const {eventDateStart, eventDateEnd} = useRuntimeConfig().public;

const fullAddress = ["Faculté d'informatique de l'Université de Namur", "Rue Grandgagnage 21, 5000 Namur, Belgique"];
const copyAddress = () => {
  copy(fullAddress.join(", "));
  toast.add({
    title: "Adresse copiée",
    description: "L'adresse de l'événement a été copiée dans le presse-papier.",
    color: "success",
  });
};

const amenities: PageFeatureProps[] = [
  {
    title: "Repos",
    icon: "i-lucide-bed",
    description: "Une salle pour dormir sera mise à disposition au sein de l'Université*",
  },
  {
    title: "Repas",
    icon: "i-lucide-utensils",
    description: "Repas fournis pendant l'événement",
  },
  {
    title: "Sanitaires",
    icon: "i-lucide-shower-head",
    description: "Accès aux installations de l'Université",
  },
];

const timeline: TimelineItem[] = [
  {
    title: "Accueil & installation",
    description: "Récupération du badge et installation du matériel.",
    icon: "i-lucide-sparkles",
    date: "Vendredi 17h30",
  },
  {
    title: "Cérémonie d'ouverture",
    description: "Présentation du thème et formation des équipes.",
    icon: "i-lucide-rocket",
    date: "Vendredi 18h",
  },
  {
    title: "Activation des neurones",
    description: "Conception, code, tests… la nuit aussi pour les plus motivés.",
    icon: "i-lucide-moon-star",
    date: "Vendredi 19h30 - Dimanche matin",
  },
  {
    title: "Présentations intermédiaires aux coachs",
    description: "Feedbacks des coachs pour orienter le développement.",
    icon: "i-lucide-clipboard-list",
    date: "Samedi fin d'après‑midi",
  },
  {
    title: "Démonstration de la partie technique des projets",
    description: "Préparation du pitch et démonstrations.",
    icon: "i-lucide-presentation",
    date: "Dimanche 12h",
  },
  {
    title: "Pitch final devant le jury",
    description: "Présentation des projets aux membres du jury.",
    icon: "i-lucide-microscope",
    date: "Dimanche 14h",
  },
  {
    title: "Cérémonie de clôture & remise des prix",
    description: "Annonce des lauréats et remise des prix.",
    icon: "i-lucide-award",
    date: "Dimanche 17h",
  },
  {
    title: "Cocktail de fin",
    description: "Un dernier moment convivial pour clôturer l'événement.",
    icon: "i-lucide-martini",
    date: "Dimanche 18h",
  },
];
</script>

<template>
  <UPageHero :ui="{container: 'max-w-full !px-0'}">
    <PageHero title="Informations" subtitle="Les informations nécessaires !"
              content="Tout ce qu'il faut savoir pour profiter au mieux de l'événement."/>
  </UPageHero>

  <UContainer class="pb-8">
    <UPageGrid class="gap-4 md:gap-6">
      <UPageCard title="Lieu" icon="i-lucide-map-pinned">
        <div class="rounded-lg overflow-hidden border border-gray-200/50 dark:border-gray-800/50">
          <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=4.855873882770539%2C50.46505796929186%2C4.859414398670197%2C50.46686773266524&amp;layer=mapnik&amp;marker=50.46596285963623%2C4.857644140720367"
              class="w-full aspect-video" loading="lazy" referrerpolicy="no-referrer-when-downgrade"/>
        </div>

        <template #description>
          <div class="space-y-1">
            <p>{{ fullAddress[0] }}</p>
            <p>{{ fullAddress[1] }}</p>
          </div>
        </template>

        <template #footer>
          <div class="flex flex-wrap gap-2">
            <UButton target="_blank" icon="i-lucide-navigation" color="primary">
              Itinéraire
            </UButton>
            <UButton variant="soft" color="neutral" icon="i-lucide-copy" @click="copyAddress">
              Copier l'adresse
            </UButton>
          </div>
        </template>
      </UPageCard>

      <UPageCard title="Date" icon="i-lucide-calendar-days"
                 description="Les horaires détaillés seront communiqués sur place.">
        <div class="grid grid-rows-2 gap-2">
          <UCard :ui="{ body: 'p-3' }" class="bg-primary-50/60 dark:bg-primary-900/20">
            <template #header>
              <UIcon name="i-lucide-clock-8" class="mt-0.5 text-primary-600"/>
              Début
            </template>
            <p class="font-medium">{{ $dayjs(eventDateStart).format("DD MMMM YYYY") }}</p>
          </UCard>

          <UCard :ui="{ body: 'p-3' }" class="bg-primary-50/60 dark:bg-primary-900/20">
            <template #header>
              <UIcon name="i-lucide-clock-8" class="mt-0.5 text-primary-600"/>
              Fin
            </template>
            <p class="font-medium">{{ $dayjs(eventDateEnd).format("DD MMMM YYYY") }}</p>
          </UCard>
        </div>
      </UPageCard>

      <UPageCard title="Contacts" icon="i-lucide-mail">
        <template #description>
          <div class="space-y-3">
            <p>N'hésite pas à nous contacter pour toute question !</p>
            <div class="grid grid-cols-1 lg:grid-cols-3 place-items-start lg:place-items-center max-lg:gap-2">
              <UButton to="https://www.facebook.com/ComputerScienceLabs/" target="_blank"
                       icon="i-simple-icons-facebook" size="lg">
                Facebook
              </UButton>
              <UButton to="mailto:event@cslabs.be" icon="i-lucide-at-sign" color="neutral" variant="soft" size="lg">
                Mail
              </UButton>
              <UButton to="https://discord.gg/Jf2Dht8" target="_blank" icon="i-simple-icons-discord" color="secondary"
                       size="lg">
                Discord
              </UButton>
            </div>
          </div>
        </template>
      </UPageCard>
    </UPageGrid>

    <UPageSection title="Commodités" icon="i-lucide-coffee" description="Tout est prévu pour coder confortablement."
                  :features="amenities" :ui="{footer: 'mt-4', container: '!pb-4 sm:!pb-6 lg:!pb-8'}">
      <template #footer>
        <span class="text-sm italic text-muted">
          *Nous vous demandons de prévoir un matelas/lit de camp que vous pourrez installer dans cette salle.
          Quelques lits de camp seront prévus pour dépanner, mais il n'y en aura pas assez pour tout le monde.
        </span>
      </template>
    </UPageSection>

    <UPageSection title="Programme" icon="i-lucide-calendar-check" description="Aperçu du week‑end (indicatif)"
                  :ui="{container: '!py-4 sm:!py-6 lg:!py-8'}">
      <UTimeline :items="timeline"/>
    </UPageSection>

    <UPageSection :ui="{container: 'px-0 !py-4 sm:!py-6 lg:!py-8'}">
      <RegisterCTA/>
    </UPageSection>
  </UContainer>
</template>
