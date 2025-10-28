<template>
  <UPageHero :ui="{container: 'max-w-full !px-0'}">
    <PageHero title="Nos partenaires" subtitle="Sans eux, rien ne serait possible !" :images="partners"/>
  </UPageHero>

  <div class="gap-2 lg:columns-2 px-8">
    <UPageCard v-for="(partner, index) in partners" :key="`partner-${index}`"
               class="break-inside-avoid mb-2 inline-block w-full p-2"
               :title="partner.name"
               draggable="false"
               orientation="horizontal"
               :to="partner.url"
               target="_blank"
               variant="outline"
               :reverse="partners.indexOf(partner) % 2 === 1"
               :ui="{title: 'text-xl'}"
    >
      <div class="flex justify-center">
        <NuxtImg :src="partner.logo" :alt="`Logo de ${partner.name}`" sizes="240px" fit="contain" class="max-h-48"/>
      </div>

      <template #description v-if="partner.description">
        <MDC :value="partner.description" />
      </template>
    </UPageCard>
  </div>
</template>
