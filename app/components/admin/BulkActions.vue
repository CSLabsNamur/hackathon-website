<script setup lang="ts">
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";

defineProps<{ count: number; items: DropdownMenuItem[]; pending: boolean }>();
const emit = defineEmits<{ clear: [] }>();
</script>

<template>
  <div v-if="count" class="flex flex-wrap items-center gap-2">
    <UButton variant="ghost" icon="i-lucide-x" color="neutral" :disabled="pending" @click="emit('clear')">
      <span class="text-sm text-muted">{{ count }} sélectionné(s)</span>
    </UButton>
    <UDropdownMenu v-if="items.length" :items :content="{align: 'end'}">
      <UButton color="neutral" variant="soft" icon="i-lucide-settings" label="Actions"
               :loading="pending" :disabled="pending"/>
    </UDropdownMenu>
  </div>
</template>
