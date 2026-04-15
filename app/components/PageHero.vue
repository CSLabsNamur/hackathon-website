<script setup lang="ts">
interface HeroImage {
  name: string;
  logo: string;
  url?: string;
}

type HeroSize = "compact" | "medium" | "large";

const {title, subtitle, content, images, size = "medium"} = defineProps<{
  title: string;
  subtitle?: string;
  content?: string;
  images?: HeroImage[];
  size?: HeroSize;
}>();

const {data: settings} = await useSettings();
const heroLogoUrl = computed(() => settings.value?.event.logoUrl ?? "/images/logo-vide.png");

const sizeClasses = computed(() => {
  const sizes: Record<HeroSize, string> = {
    compact: "h-56 md:h-64 lg:h-72",
    medium: "h-64 md:h-72 lg:h-80",
    large: "h-80 md:h-96 lg:h-[26rem]",
  };
  return sizes[size];
});

const titleClasses = computed(() => {
  const sizes: Record<HeroSize, string> = {
    compact: "text-3xl md:text-4xl",
    medium: "text-4xl md:text-5xl",
    large: "text-4xl md:text-5xl lg:text-6xl",
  };
  return sizes[size];
});

const subtitleClasses = computed(() => {
  const sizes: Record<HeroSize, string> = {
    compact: "text-base md:text-lg",
    medium: "text-xl md:text-2xl",
    large: "text-lg md:text-2xl lg:text-3xl",
  };
  return sizes[size];
});

const logoClasses = computed(() => {
  const sizes: Record<HeroSize, string> = {
    compact: "w-[130px] md:w-[150px] lg:w-[180px] -top-6 md:-top-8 lg:-top-12",
    medium: "w-[140px] md:w-[180px] lg:w-[240px] -top-4 md:-top-6 lg:-top-8",
    large: "w-[150px] md:w-[220px] lg:w-[280px] -top-4 md:-top-6 lg:-top-8",
  };
  return sizes[size];
});

const contentClasses = computed(() => {
  const sizes: Record<HeroSize, string> = {
    compact: "-translate-y-1 md:-translate-y-2 lg:-translate-y-3 -mt-6 md:-mt-10 lg:-mt-12",
    medium: "-translate-y-1 md:-translate-y-2 lg:-translate-y-4",
    large: "",
  };
  return sizes[size];
});
</script>

<template>
  <div class="relative w-full">
    <!-- TODO: Use NuxtImg's Supabase provider -->
    <img :src="heroLogoUrl" alt="Logo Hackathon"
         :class="['absolute z-10 left-1/2 -translate-1/2 drop-shadow-2xl',
                  'origin-center transition-transform duration-1000 active:transform-[rotateY(180deg)]',
                  logoClasses]">
    <div id="hero-background" :class="['bg-cslabs-500', sizeClasses]">
      <div :class="['flex flex-col items-center justify-center h-full text-center',
                     'px-3 md:px-4 gap-1 md:gap-2 lg:gap-3 py-6 md:py-4 lg:py-0',
                     contentClasses]">
        <h1 :class="['font-bold tracking-tight leading-tight', titleClasses]">
          {{ title }}
        </h1>
        <h2 v-if="subtitle"
            :class="['whitespace-pre-line font-semibold leading-tight', subtitleClasses]">
          {{ subtitle }}
        </h2>
        <p v-if="content || $slots.content"
           class="text-sm md:text-lg xl:text-xl whitespace-pre-line max-w-2xl leading-snug">
          <slot name="content">{{ content }}</slot>
        </p>
        <div v-if="images?.length"
             class="flex gap-2 md:gap-4 mt-2 md:mt-4 overflow-x-auto max-w-full justify-center flex-wrap">
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
