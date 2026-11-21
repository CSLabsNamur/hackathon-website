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

const {status, data: schedule, refresh} = await useSchedule({lazy: true});

const now = useNow({scheduler: (update) => useIntervalFn(update, 1000)});
const dayjs = useDayjs();
const sortedSchedule = computed(() => sortScheduleItems(schedule.value));
const liveItemIds = computed(() => new Set(sortedSchedule.value
    .filter((item) => isScheduleItemLive(item, now.value))
    .map((item) => item.id),
));
const nextItem = computed(() => sortedSchedule.value.find((item) => dayjs(item.startTime).isAfter(now.value)));
const jumpTargetId = computed(() => liveItemIds.value.values().next().value ?? nextItem.value?.id);

function jumpToCurrentActivity() {
  const target = document.getElementById(`schedule-${jumpTargetId.value}`);
  target?.focus({preventScroll: true});
  target?.scrollIntoView({block: "start"});
}

useRefreshOnPageReturn(refresh);

const timelineItems = computed<TimelineScheduleItem[]>(() =>
    sortedSchedule.value.map((item) => ({
      value: item.id,
      title: item.title,
      description: item.description,
      icon: item.icon ?? "i-lucide-calendar",
      scheduleItem: item,
    })),
);
</script>

<template>
  <UContainer class="max-w-4xl">
    <UAlert v-if="status === 'error'" color="error" variant="soft" icon="i-lucide-alert-circle"
            title="Impossible de charger le programme"
            :actions="[{label: 'Réessayer', color: 'error', variant: 'soft', onClick: () => refresh()}]"/>

    <div v-else-if="(status === 'pending' || status === 'idle') && !schedule" class="grid gap-4">
      <USkeleton v-for="n in 5" :key="`timeline-skeleton-${n}`" class="h-28 w-full"/>
    </div>

    <UCard v-else>
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-col gap-1">
            <h2 class="text-lg font-semibold text-highlighted">Ligne du temps</h2>
            <p class="text-sm text-muted">
              Retrouvez ici tous les événements importants du hackathon.
            </p>
          </div>
          <UButton v-if="jumpTargetId" color="neutral" variant="soft" icon="i-lucide-clock" size="sm"
                   @click="jumpToCurrentActivity">
            {{ liveItemIds.size ? "Maintenant" : "Prochaine activité" }}
          </UButton>
        </div>
      </template>

      <UTimeline v-if="timelineItems.length > 0" :items="timelineItems" value-key="value">
        <template #wrapper="{item}">
          <ScheduleFullCard :id="`schedule-${item.value}`" :item :live="liveItemIds.has(item.value)"
                            tabindex="-1"/>
        </template>
      </UTimeline>
      <UEmpty v-else title="Aucun événement programmé"
              description="Le programme sera bientôt disponible." icon="i-lucide-calendar-search"/>
    </UCard>
  </UContainer>
</template>
