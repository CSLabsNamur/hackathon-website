<script setup lang="ts">
import type { IconProps } from "#ui/components/Icon.vue";
import { Label, Primitive } from "reka-ui";

defineProps<{
  label: string;
  icon?: IconProps["name"];
}>();
</script>

<template>
  <Primitive class="text-sm grid gap-1">
    <div class="flex items-center gap-1.5">
      <UIcon v-if="icon" :name="icon" class="size-4 text-muted"/>
      <Label class="block font-medium text-default">
        <slot name="label" :label="label">
          {{ label }}
        </slot>
      </Label>
    </div>

    <div class="relative">
      <slot/>
    </div>
  </Primitive>
</template>
