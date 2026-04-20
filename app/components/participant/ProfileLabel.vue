<script setup lang="ts">
import type { IconProps } from "#ui/components/Icon.vue";
import { Label, Primitive } from "reka-ui";

defineProps<{
  label: string;
  icon?: IconProps["name"];
  value?: string | number | null;
  url?: string | null;
}>();
</script>

<template>
  <Primitive class="text-sm grid gap-1.5">
    <div class="flex items-center gap-1.5">
      <UIcon v-if="icon" :name="icon" class="size-4 text-muted"/>
      <Label class="block font-medium text-default">
        <slot name="label" :label="label">
          {{ label }}
        </slot>
      </Label>
    </div>

    <div class="relative">
      <template v-if="value !== undefined">
        <slot v-if="value">
          <template v-if="!url">{{ value }}</template>
          <UButton v-else variant="link" color="neutral" :to="url" target="_blank" external
                   class="p-0 text-highlighted">
            {{ value }}
          </UButton>
        </slot>
        <span v-else class="text-muted pointer-events-none select-none">Non renseigné</span>
      </template>
      <slot v-else/>
    </div>
  </Primitive>
</template>
