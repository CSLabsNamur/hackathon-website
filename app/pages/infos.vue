<script setup lang="ts">
import type { PageFeatureProps } from "#ui/components/PageFeature.vue";
import type { TimelineItem } from "@nuxt/ui";

const {copy} = useClipboard();
const toast = useToast();
const {eventDateStart, eventDateEnd} = useRuntimeConfig().public;

const {data: schedule} = await useSchedule({lazy: false});

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

const timeline = computed<TimelineItem[] | undefined>(() => schedule.value?.map((item) => ({
  title: item.title,
  description: item.description,
  date: item.dateString,
  icon: item.icon,
})));

useSeoMeta({
  title: "Informations",
  description: "Lieu, dates, contacts et programme du Hackathon du CSLabs à l’UNamur : tout ce qu’il faut savoir avant de venir.",
});
</script>

<template>
  <UPageHero :ui="{container: 'max-w-full !px-0'}">
    <PageHero title="Informations" subtitle="Tout ce qu'il faut savoir pour profiter au mieux de l'événement."/>
  </UPageHero>

  <UContainer>
    <UPageGrid class="gap-6 md:gap-8">
      <!-- Emplacement -->
      <UPageCard title="Lieu de l'événement" icon="i-lucide-map-pinned" :ui="{description: 'mt-5'}">
        <template #description>
          <div class="grid gap-4">
            <div class="flex gap-2.5">
              <UIcon name="i-lucide-university" class="size-4 text-primary mt-0.5 shrink-0"/>
              <div class="text-sm leading-relaxed">
                <p class="font-medium text-highlighted">{{ fullAddress[0] }}</p>
                <p class="text-muted">{{ fullAddress[1] }}</p>
              </div>
            </div>

            <div class="rounded-xl overflow-hidden border border-default shadow-sm">
              <iframe
                  src="https://www.openstreetmap.org/export/embed.html?bbox=4.855873882770539%2C50.46505796929186%2C4.859414398670197%2C50.46686773266524&amp;layer=mapnik&amp;marker=50.46596285963623%2C4.857644140720367"
                  class="w-full aspect-video"
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
              />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <UButton class="justify-center" color="primary" icon="i-lucide-navigation" variant="solid"
                       to="https://www.openstreetmap.org/directions?from=&to=50.46588169490292,4.857644508142088&engine=osrm_car"
                       target="_blank">
                Itinéraire
              </UButton>
              <UButton variant="soft" color="neutral" icon="i-lucide-copy" class="justify-center"
                       @click="copyAddress">
                Copier l'adresse
              </UButton>
            </div>
          </div>
        </template>
      </UPageCard>

      <!-- Date -->
      <UPageCard title="Dates de l'événement" icon="i-lucide-calendar-days" :ui="{description: 'mt-5.5'}">
        <template #description>
          <div class="grid gap-4">
            <div class="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div class="flex items-center justify-center size-12 rounded-lg bg-primary/10 shrink-0">
                <UIcon name="i-lucide-calendar-check" class="size-6 text-primary"/>
              </div>
              <div class="flex-1">
                <p class="text-xs font-medium text-muted uppercase tracking-wide">Début</p>
                <p class="text-lg font-semibold text-highlighted">
                  {{ $dayjs(eventDateStart).format("DD MMMM YYYY") }}
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div class="flex items-center justify-center size-12 rounded-lg bg-primary/10 shrink-0">
                <UIcon name="i-lucide-calendar-x" class="size-6 text-primary"/>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-muted uppercase tracking-wide">Fin</p>
                <p class="text-lg font-semibold text-highlighted">{{ $dayjs(eventDateEnd).format("DD MMMM YYYY") }}</p>
              </div>
            </div>

            <div class="flex items-start gap-2 p-3 rounded-lg bg-elevated">
              <UIcon name="i-lucide-info" class="size-4 text-primary mt-0.5 shrink-0"/>
              <p class="text-xs text-muted leading-relaxed">
                Les horaires détaillés seront communiqués sur place le jour de l'événement.
              </p>
            </div>
          </div>
        </template>
      </UPageCard>

      <!-- Contacts -->
      <UPageCard title="Besoin d'aide ?" icon="i-lucide-message-circle" :ui="{description: 'mt-5'}">
        <template #description>
          <div class="grid gap-4">
            <p class="text-sm text-muted">
              Notre équipe est là pour répondre à toutes vos questions avant et pendant l'événement.
            </p>

            <div class="grid gap-5">
              <div class="flex items-center gap-3 p-3 rounded-lg bg-elevated">
                <div class="flex items-center justify-center size-10 rounded-lg bg-neutral/10 shrink-0">
                  <UIcon name="i-lucide-at-sign" class="size-5 text-neutral"/>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium text-muted">Email</p>
                  <a href="mailto:event@cslabs.be"
                     class="text-sm font-medium text-highlighted hover:text-primary transition-colors">
                    event@cslabs.be
                  </a>
                </div>
              </div>

              <div class="grid gap-2">
                <p class="text-xs font-medium text-muted uppercase tracking-wide">Réseaux sociaux</p>
                <div class="grid grid-cols-2 gap-2">
                  <!-- TODO: Centralize socials links to avoid duplication -->
                  <UButton to="https://www.instagram.com/cslabs_namur/" target="_blank"
                           icon="i-simple-icons-instagram" variant="soft" class="flex-1 justify-center"
                           :ui="{base: 'p-2.5'}">
                    Instagram
                  </UButton>
                  <UButton to="https://discord.gg/Jf2Dht8" target="_blank" icon="i-simple-icons-discord"
                           color="secondary" variant="soft" class="flex-1 justify-center" :ui="{base: 'p-2.5'}">
                    Discord
                  </UButton>
                </div>
              </div>
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
      <div class="grid justify-center">
        <UTimeline v-if="timeline" :items="timeline"/>
        <p v-else class="text-muted">Le programme sera bientôt disponible.</p>
      </div>
    </UPageSection>

    <UPageSection :ui="{container: 'px-0 !py-4 sm:!py-6 lg:!py-8'}">
      <RegisterCTA/>
    </UPageSection>
  </UContainer>
</template>
