<script setup lang="ts">
import type { TimelineItem } from "@nuxt/ui";
import { formatScheduleRange } from "~/utils/schedule";

type TimelineScheduleItem = TimelineItem & {
  value: string;
  scheduleItem: ScheduleItem;
};

defineProps<{
  item: TimelineScheduleItem;
  editingItemId: string;
  currentScheduleItemId: string | null;
}>()
</script>

<template>
  <div class="rounded-xl border p-4 transition"
       :class="item.value === editingItemId ? 'border-primary/50 bg-primary/8 shadow-sm' : 'border-default bg-default hover:border-primary/30 hover:bg-elevated/60'">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 flex flex-col gap-1">
        <p class="text-xs font-medium uppercase text-muted">
          {{ item.date }}
        </p>
        <p class="font-semibold text-highlighted">{{ item.title }}</p>
      </div>

      <div class="flex flex-wrap gap-2">
        <UBadge v-if="item.scheduleItem.special" color="warning" variant="subtle">Temps fort</UBadge>
        <UBadge v-if="currentScheduleItemId === item.value" color="success" variant="subtle">En cours</UBadge>
      </div>
    </div>

    <p v-if="item.description" class="mt-2 text-sm text-muted">
      {{ item.description }}
    </p>

    <div class="mt-3 flex flex-wrap gap-2">
      <UBadge color="neutral" variant="soft">
        {{ formatScheduleRange(item.scheduleItem.startTime, item.scheduleItem.endTime) }}
      </UBadge>
    </div>
  </div>
</template>
