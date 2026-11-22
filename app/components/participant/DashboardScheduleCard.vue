<script setup lang="ts">
const props = defineProps<{ now: Date }>();

const {data: schedule, status, refresh} = await useSchedule({lazy: true});
const dayjs = useDayjs();
const upcomingItems = computed(() => sortScheduleItems(schedule.value)
    .filter((item) => dayjs(item.endTime).isAfter(props.now))
    .slice(0, 4),
);

function endTimeFormat(item: ScheduleItem) {
  const start = dayjs(item.startTime).tz();
  const end = dayjs(item.endTime).tz();
  return start.isSame(end, "day") ? "HH[h]mm" : "ddd D MMM à HH[h]mm";
}

useRefreshOnPageReturn(refresh);
</script>

<template>
  <UCard :ui="{body: 'p-0 sm:p-0'}">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-lg font-semibold text-highlighted">Au programme</h2>
        <UButton to="/participant/schedule" color="neutral" variant="ghost" size="sm"
                 trailing-icon="i-lucide-arrow-right"/>
      </div>
    </template>

    <div v-if="status === 'error'" class="p-4 sm:p-6">
      <UAlert color="error" variant="soft" icon="i-lucide-circle-alert"
              title="Impossible de charger le programme"
              :actions="[{label: 'Réessayer', color: 'error', variant: 'soft', onClick: () => refresh()}]"/>
    </div>

    <div v-else-if="!schedule" class="grid gap-4 p-4 sm:p-6">
      <USkeleton v-for="n in 3" :key="n" class="h-16"/>
    </div>

    <ul v-else-if="upcomingItems.length" class="divide-y divide-default">
      <li v-for="item in upcomingItems" :key="item.id" class="flex gap-4 p-4 sm:p-6"
          :class="{'bg-primary/5': isScheduleItemLive(item, now)}">
        <div class="w-16 shrink-0 space-y-1 text-sm">
          <p class="text-xs text-muted">{{ formatDate(item.startTime, "ddd D MMM") }}</p>
          <p class="font-semibold text-highlighted">
            {{ formatDate(item.startTime, "HH[h]mm") }}
          </p>
        </div>
        <div class="min-w-0 flex-1 grid gap-1.5">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="font-medium text-highlighted">{{ item.title }}</h3>
            <UBadge v-if="isScheduleItemLive(item, now)" color="success" variant="subtle" size="sm">
              En cours
            </UBadge>
          </div>
          <p v-if="item.description" class="text-sm text-muted">{{ item.description }}</p>
          <p class="text-xs text-muted">
            Jusqu'à
            {{ formatDate(item.endTime, endTimeFormat(item)) }}
          </p>
        </div>
      </li>
    </ul>

    <UEmpty v-else :title="schedule.length ? 'Programme terminé' : 'Aucune activité publiée'"
            icon="i-lucide-calendar-days" variant="naked"/>
  </UCard>
</template>
