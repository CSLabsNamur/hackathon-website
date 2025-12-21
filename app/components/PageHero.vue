<script setup lang="ts">
const {title, subtitle, content, images} = defineProps<{
  title: string;
  subtitle?: string;
  content?: string;
  images?: Partner[];
}>();
</script>

<template>
  <div class="relative w-full">
    <NuxtImg src="/images/logo.png" alt="Logo Hackathon" sizes="200px lg:240px xl:280px"
             class="absolute z-10 -top-4 xl:-top-8 left-1/2 -translate-1/2 drop-shadow-2xl
                    origin-center transition-transform duration-1000 active:transform-[rotateY(180deg)]"/>
    <div class="bg-cslabs-500 h-96" id="hero-background">
      <div class="flex flex-col items-center justify-center h-full text-center px-4">
        <h1 class="text-4xl md:text-5xl font-bold mb-2">{{ title }}</h1>
        <p v-if="subtitle" class="text-xl md:text-2xl mb-1.5 whitespace-pre-line">{{ subtitle }}</p>
        <p class="text-lg md:text-xl whitespace-pre-line">
          <slot name="content">{{ content }}</slot>
        </p>
        <div v-if="images" class="flex gap-4 mt-8 overflow-x-auto">
          <template v-for="image in images" :key="image.name">
            <ImageBubble :image="image.logo" :url="image.url" :name="image.name"/>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
#hero-background {
  clip-path: polygon(0 0, 100% 10%, 100% 90%, 0% 100%);
}
</style>
