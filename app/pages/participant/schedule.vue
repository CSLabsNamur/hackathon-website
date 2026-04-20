<script setup lang="ts">
import type { TimelineItem } from "@nuxt/ui";

definePageMeta({
  layout: {
    name: "user-dashboard",
    props: {
      title: "Programme",
    },
  },
  middleware: "participant-auth",
});

type TimelineScheduleItem = TimelineItem & {
  value: string;
  scheduleItem: ScheduleItem;
};

const {status, data: schedule, error} = await useSchedule({lazy: true});

const sortedSchedule = computed(() => sortScheduleItems(schedule.value));

const currentScheduleItemId = computed(() => {
  return findLiveScheduleItem(sortedSchedule.value)?.id ?? null;
});

const timelineItems = computed<TimelineScheduleItem[]>(() =>
    sortedSchedule.value.map((item) => ({
      value: item.id,
      title: item.title,
      description: item.description,
      date: item.dateString,
      icon: item.icon ?? "i-lucide-calendar",
      scheduleItem: item,
    })),
);
</script>

<template>
  <UContainer class="max-w-4xl">
    <UAlert v-if="status === 'error'" color="error" variant="soft" icon="i-lucide-alert-circle"
            title="Impossible de charger le programme"
            :description="error?.statusMessage || error?.message || 'Réessayez dans quelques instants.'"/>

    <div v-else-if="(status === 'pending' || status === 'idle') && !schedule" class="grid gap-4">
      <USkeleton v-for="n in 5" :key="`timeline-skeleton-${n}`" class="h-28 w-full"/>
    </div>

    <UCard v-else>
      <template #header>
        <div class="flex flex-col gap-1">
          <h2 class="text-lg font-semibold text-highlighted">Ligne du temps</h2>
          <p class="text-sm text-muted">
            Retrouvez ici tous les événements importants du hackathon.
          </p>
        </div>
      </template>

      <UTimeline v-if="timelineItems.length > 0" :items="timelineItems" value-key="value">
        <template #wrapper="{item}">
          <ScheduleFullCard :item="item" :current-schedule-item-id="currentScheduleItemId"/>
        </template>
      </UTimeline>
      <UEmpty v-else title="Aucun événement programmé"
              description="Le programme sera bientôt disponible." icon="i-lucide-calendar-search"/>
    </UCard>
  </UContainer>
</template>
