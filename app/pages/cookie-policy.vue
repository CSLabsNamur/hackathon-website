<script setup lang="ts">
const {data: page} = await useAsyncData("cookie-policy", () => queryCollection("pages").path("/pages/cookie-policy").first());

useSeoMeta({
  title: "Politique de cookies",
  description: "Découvrez comment le site du Hackathon du CSLabs utilise les cookies et comment vous pouvez gérer vos préférences.",
});
</script>

<template>
  <UPageHero :ui="{container: 'max-w-full !px-0'}">
    <PageHero title="Politique de cookies" subtitle="Tu veux un cookie ou pas ?" content="🍪"/>
  </UPageHero>

  <div class="flex justify-center px-6 py-10">
    <ContentRenderer v-if="page" :value="page" class="max-w-4xl"/>
  </div>
</template>
