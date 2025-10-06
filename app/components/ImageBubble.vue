<script setup lang="ts">
defineProps<{
  name: string;
  image: string;
  url?: string;
}>();
</script>

<template>
  <NuxtLink :to="url" external target="_blank"
            class="flex items-center justify-center size-20 bg-white rounded-full overflow-hidden">
    <NuxtImg :src="image" :alt="name" class="w-full h-full object-contain p-3"/>
  </NuxtLink>
</template>
