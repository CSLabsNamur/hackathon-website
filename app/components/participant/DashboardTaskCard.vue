<script setup lang="ts">
import type { DashboardTask } from "~/utils/participantDashboard";

defineProps<{
  task: DashboardTask;
}>();
</script>

<template>
  <UCard variant="subtle" :ui="{body: 'p-4'}">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="flex gap-3">
        <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UIcon :name="task.icon" class="size-5"/>
        </div>

        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <p class="text-lg font-semibold text-highlighted">{{ task.title }}</p>
            <UBadge :color="task.color" variant="soft">{{ task.badge }}</UBadge>
          </div>
          <p class="max-w-3xl text-sm leading-relaxed text-muted">{{ task.description }}</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 sm:justify-end">
        <UButton v-for="action in task.actions" :key="`${task.id}-${action.label}`"
                 v-bind="action" size="sm"/>
      </div>
    </div>
  </UCard>
</template>
