<script setup lang="ts">
const {data: sponsors} = await useSponsors();

const heroSponsors = computed(() => {
  return sponsors.value?.filter((partner) => partner.logo).map(({name, logo, url}) => ({name, logo, url}));
});

useSeoMeta({
  title: "Partenaires",
  description: "Découvrez les partenaires qui soutiennent le Hackathon du CSLabs et rendent l’événement possible.",
});
</script>

<template>
  <UPageHero :ui="{container: 'max-w-full !px-0'}">
    <PageHero size="medium" title="Nos partenaires" subtitle="Sans eux, rien ne serait possible !"/>
  </UPageHero>

  <UContainer class="max-w-[80vw]">
    <div class="grid gap-4 lg:gap-8">
      <UCard class="place-self-center max-w-3xl bg-primary/10">
        <div class="grid gap-3 text-center text-sm">
          <p>
            Votre organisation peut contribuer de plusieurs façons : présence sur place, mentorat, lots, visibilité ou
            soutien logistique.
          </p>
          <p>
            Si le positionnement vous parle, nous échangeons rapidement pour construire une formule adaptée.
          </p>

          <div class="pt-2">
            <UButton to="/devenir-partenaire" size="xl" trailing-icon="i-lucide-handshake">
              Envie de devenir partenaire ?
            </UButton>
          </div>
        </div>
      </UCard>

      <div v-if="!sponsors?.length" class="gap-2 lg:columns-2">
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
            <!--eslint-disable-next-line vue/no-v-html -->
            <article class="max-w-none" v-html="getSponsorHTMLDescription(sponsor)"/>
          </template>
        </UPageCard>
      </div>

      <div v-else class="flex flex-col items-center gap-4">
        <LazyUEmpty title="Aucun partenaire pour le moment" icon="i-lucide-handshake"
                    description="Nous mettons à jour cette page régulièrement, n’hésitez pas à revenir plus tard !"/>
      </div>
    </div>
  </UContainer>
</template>
