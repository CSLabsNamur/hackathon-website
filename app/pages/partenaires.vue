<script setup lang="ts">
import { partners } from "~/utils/partners";

useSeoMeta({
  title: "Partenaires",
  description: "Découvrez les partenaires qui soutiennent le Hackathon du CSLabs et rendent l’événement possible.",
});
</script>

<template>
  <UPageHero :ui="{container: 'max-w-full !px-0'}">
    <PageHero title="Nos partenaires" subtitle="Sans eux, rien ne serait possible !" :images="partners"/>
  </UPageHero>

  <UContainer class="max-w-[80vw]">
    <div class="flex justify-center px-8 pb-8">
      <UButton to="/devenir-partenaire" size="xl" trailing-icon="i-lucide-handshake">
        Envie de devenir partenaire ?
      </UButton>
    </div>

    <div class="gap-2 lg:columns-2 px-8">
      <UPageCard v-for="(partner, index) in partners" :key="`partner-${index}`"
                 class="break-inside-avoid mb-2 inline-block w-full p-2" :title="partner.name" draggable="false"
                 orientation="horizontal" :to="partner.url" target="_blank" variant="outline"
                 :reverse="partners.indexOf(partner) % 2 === 1" :ui="{title: 'text-xl'}">
        <div class="flex justify-center">
          <Suspense>
            <NuxtImg :src="partner.logo" :alt="`Logo de ${partner.name}`" sizes="240px" fit="contain" :placeholder="30"
                     quality="80" class="max-h-48"/>
          </Suspense>
        </div>

        <template #description v-if="partner.description">
          <MDC :value="partner.description"/>
        </template>
      </UPageCard>
    </div>
  </UContainer>
</template>
