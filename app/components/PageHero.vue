<script setup lang="ts">
interface HeroImage {
  name: string;
  logo: string;
  url?: string;
}

const {title, subtitle, content, images} = defineProps<{
  title: string;
  subtitle?: string;
  content?: string;
  images?: HeroImage[];
}>();

const {data: settings} = await useSettings();
const heroLogoUrl = computed(() => settings.value?.event.logoUrl ?? "/images/logo-vide.png");
</script>

<template>
  <div class="relative w-full">
    <!-- TODO: Use NuxtImg's Supabase provider -->
    <img :src="heroLogoUrl" alt="Logo Hackathon"
         class="absolute z-10 -top-4 xl:-top-8 left-1/2 -translate-1/2 drop-shadow-2xl
                origin-center transition-transform duration-1000 active:transform-[rotateY(180deg)]
                w-[200px] lg:w-[240px] xl:w-[280px]">
    <div id="hero-background" class="bg-cslabs-500 h-96">
      <div class="flex flex-col items-center justify-center h-full text-center px-4">
        <h1 class="text-4xl md:text-5xl font-bold mb-2">{{ title }}</h1>
        <p v-if="subtitle" class="text-xl md:text-2xl mb-1.5 whitespace-pre-line">{{ subtitle }}</p>
        <p class="text-lg md:text-xl whitespace-pre-line">
          <slot name="content">{{ content }}</slot>
        </p>
        <div v-if="images?.length" class="flex gap-4 mt-8 overflow-x-auto">
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
