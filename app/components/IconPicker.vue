<script setup lang="ts">
import { icons as lucideIcons } from "@iconify-json/lucide";
import { icons as simpleIcons } from "@iconify-json/simple-icons";
import type { CommandPaletteGroup } from "@nuxt/ui";

type IconCollection = "lucide" | "simple-icons";

const model = defineModel<string>();
const props = withDefaults(defineProps<{
  collections?: IconCollection[];
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
}>(), {
  collections: () => ["lucide", "simple-icons"] as IconCollection[],
  disabled: false,
  placeholder: "Choisissez une icône",
  searchPlaceholder: "Rechercher...",
});

const lucideItems = Object.keys(lucideIcons.icons).map((name) => ({
  label: name,
  value: `i-lucide-${name}`,
  icon: `i-lucide-${name}`,
}));

const simpleIconItems = Object.keys(simpleIcons.icons).map((name) => ({
  label: name,
  value: `i-simple-icons-${name}`,
  icon: `i-simple-icons-${name}`,
}));

const allGroups: CommandPaletteGroup<{ value: string }>[] = [
  {
    id: "lucide",
    label: "Lucide",
    items: lucideItems,
  },
  {
    id: "simple-icons",
    label: "Simple Icons",
    items: simpleIconItems,
  },
];

const groups = allGroups.filter((group) => props.collections.includes(group.id as IconCollection));
</script>

<template>
  <UPopover>
    <UButton color="neutral" variant="outline" class="w-full justify-between" :disabled>
      <div class="flex min-w-0 items-center gap-2">
        <LazyUIcon v-if="model" :name="model" class="size-4"/>
        <span class="truncate">{{ model || placeholder }}</span>
      </div>
      <LazyUIcon name="i-lucide-chevron-down" class="size-4 text-muted"/>
    </UButton>

    <template #content>
      <UCommandPalette v-model="model" value-key="value" :groups :placeholder="searchPlaceholder" :disabled
                       class="h-80 w-96"/>
    </template>
  </UPopover>
</template>
