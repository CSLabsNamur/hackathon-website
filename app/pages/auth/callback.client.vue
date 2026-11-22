<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: "login-redirect",
});
</script>

<template>
  <UContainer class="max-w-md">
    <h1 class="text-2xl font-bold">Redirection...</h1>
  </UContainer>
</template>
