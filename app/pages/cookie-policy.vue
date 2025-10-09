<script setup lang="ts">
const {data: page} = await useAsyncData("cookie-policy", () => queryCollection("pages").path("/pages/cookie-policy").first());
</script>

<template>
  <UPageHero :ui="{container: 'max-w-full !px-0'}">
    <PageHero title="Politique de cookies" subtitle="Tu veux un cookie ou pas ?" content="🍪">
    </PageHero>
  </UPageHero>

  <div class="flex justify-center px-6 py-10">
    <ContentRenderer v-if="page" :value="page" class="max-w-4xl"/>
  </div>
</template>
