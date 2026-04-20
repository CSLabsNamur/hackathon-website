<script setup lang="ts">
import type { DashboardMetric } from "~/utils/participantDashboard";

defineProps<{
  metric: DashboardMetric;
}>();
</script>

<template>
  <UPageCard variant="subtle"
             :ui="{container: 'gap-y-3', wrapper: 'items-start', title: 'font-normal text-muted text-xs uppercase tracking-wide'}">
    <template #leading>
      <div class="flex size-12 items-center justify-center rounded-2xl" :class="metric.iconClass">
        <UIcon :name="metric.icon" class="size-6"/>
      </div>
    </template>

    <div class="grid gap-3">
      <div class="grid gap-1">
        <p class="text-2xl font-semibold text-highlighted">{{ metric.value }}</p>
        <p class="text-sm leading-relaxed text-muted">{{ metric.description }}</p>
      </div>

      <div class="grid gap-2">
        <div v-if="metric.showProgress !== false" class="h-2 overflow-hidden rounded-full bg-default">
          <div class="h-full rounded-full transition-[width] duration-300" :class="metric.progressClass"
               :style="{width: `${metric.progress ?? 0}%`}"/>
        </div>
        <p class="text-xs font-medium uppercase tracking-wide text-muted">{{ metric.title }}</p>
      </div>
    </div>
  </UPageCard>
</template>
