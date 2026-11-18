<script setup lang="ts">
import type { IconProps } from "#ui/components/Icon.vue";

defineProps<{
  label: string;
  icon?: IconProps["name"];
  value?: string | number | null;
  url?: string | null;
}>();
</script>

<template>
  <dl class="min-w-0 text-sm grid content-start gap-1.5">
    <dt class="flex items-center gap-1.5">
      <UIcon v-if="icon" :name="icon" class="size-4 text-muted"/>
      <span class="block font-medium text-default">
        <slot name="label" :label="label">
          {{ label }}
        </slot>
      </span>
    </dt>

    <dd class="relative min-w-0 whitespace-pre-line wrap-anywhere">
      <template v-if="value !== undefined">
        <slot v-if="value">
          <template v-if="!url">{{ value }}</template>
          <UButton v-else variant="link" color="neutral" :to="url" target="_blank" external
                   class="max-w-full p-0 text-highlighted whitespace-normal text-left">
            {{ value }}
          </UButton>
        </slot>
        <span v-else class="text-muted pointer-events-none select-none">Non renseigné</span>
      </template>
      <slot v-else/>
    </dd>
  </dl>
</template>
