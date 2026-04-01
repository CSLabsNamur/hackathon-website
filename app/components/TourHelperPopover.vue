<script setup lang="ts">
import { UButton } from "#components";

const props = defineProps<{
  title: string,
  description: string,
  statusKey: string,
  placement: "top" | "bottom" | "left" | "right",
}>();

const popoverDismissed = useHelpPopoverStatus(props.statusKey);
const popoverOpen = useHelpPopoverOpen(popoverDismissed);
</script>

<template>
  <UPopover v-model:open="popoverOpen" :ui="{content: 'p-2 w-xs'}" :dismissible="false" :content="{side: 'top'}" arrow>
    <slot name="default">
      <UButton color="primary" variant="outline" size="sm">
        {{ props.title }}
      </UButton>
    </slot>

    <template #content="{close}">
      <slot name="content" :close>
        <div class="flex items-center justify-between">
          <h2 class="text-highlighted font-semibold">
            {{ props.title }}
          </h2>
          <UButton color="neutral" variant="ghost" icon="i-lucide-x" @click="close"/>
        </div>

        <h3 class="text-muted text-sm mt-2 whitespace-normal wrap-break-word">
          {{ props.description }}
        </h3>
      </slot>
    </template>
  </UPopover>
</template>
