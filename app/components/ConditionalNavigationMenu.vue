<script setup lang="ts">
import type { NavigationMenuProps } from "@nuxt/ui";

export type ConditionalNavigationMenuItem = NavigationMenuProps["items"] & { condition?: boolean };
export type ConditionalNavigationMenuProps = Partial<Omit<NavigationMenuProps, "items">> & {
  items?: Array<ConditionalNavigationMenuItem>;
};

const props = defineProps<ConditionalNavigationMenuProps>();


const itemsFinal = computed(() => (props.items ?? [])
    // Only show routes whose condition is true (or no condition at all), unless in dev mode
    .filter(item => import.meta.dev || (item.condition ?? true))
    .map(({condition, ...rest}) => rest));
</script>

<template>
  <UNavigationMenu v-bind="props" :items="itemsFinal"/>
</template>
