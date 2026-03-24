<script setup lang="ts">
import { generateHTML } from "@tiptap/html";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { sponsorDescriptionStarterKit } from "~/utils/sponsors";

const {data: sponsors} = await useSponsors();

const heroSponsors = computed(() => {
  return sponsors.value?.filter((partner) => partner.logo).map(({name, logo, url}) => ({name, logo, url}));
});

const getSponsorHTMLDescription = (sponsor: Sponsor) => {
  if (sponsorHasDescription(sponsor)) {
    return generateHTML(sponsor.description as JSONContent, [StarterKit.configure(sponsorDescriptionStarterKit)]);
  }
};

useSeoMeta({
  title: "Partenaires",
  description: "Découvrez les partenaires qui soutiennent le Hackathon du CSLabs et rendent l’événement possible.",
});
</script>

<template>
  <UPageHero :ui="{container: 'max-w-full !px-0'}">
    <PageHero title="Nos partenaires" subtitle="Sans eux, rien ne serait possible !" :images="heroSponsors"/>
  </UPageHero>

  <UContainer class="max-w-[80vw]">
    <div class="flex justify-center px-8 pb-8">
      <UButton to="/devenir-partenaire" size="xl" trailing-icon="i-lucide-handshake">
        Envie de devenir partenaire ?
      </UButton>
    </div>

    <div class="gap-2 lg:columns-2 px-8">
      <UPageCard v-for="(sponsor, index) in sponsors" :key="sponsor.name"
                 class="break-inside-avoid mb-2 inline-block w-full p-2" :title="sponsor.name" draggable="false"
                 orientation="horizontal" :to="sponsor.url || undefined" :target="sponsor.url ? '_blank' : undefined"
                 variant="outline" :reverse="index % 2 === 1" :ui="{title: 'text-xl'}">
        <div class="flex justify-center">
          <img v-if="sponsor.logo" :src="sponsor.logo" :alt="`Logo de ${sponsor.name}`"
               class="max-h-48 object-contain" loading="lazy">
          <div v-else class="flex size-32 items-center justify-center rounded-2xl bg-muted">
            <Icon name="i-lucide-image-off" class="size-8 text-muted"/>
          </div>
        </div>

        <template v-if="sponsorHasDescription(sponsor)" #description>
          <article class="prose dark:prose-invert max-w-none" v-html="getSponsorHTMLDescription(sponsor)"/>
        </template>
      </UPageCard>
    </div>
  </UContainer>
</template>
