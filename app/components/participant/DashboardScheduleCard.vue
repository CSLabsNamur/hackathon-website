<script setup lang="ts">
import { isScheduleItemLive } from "~/utils/schedule";

const props = defineProps<{
  spotlight: ScheduleItem | null;
  secondaryItems: ScheduleItem[];
}>();
</script>

<template>
  <UCard :ui="{body: 'p-6'}">
    <div class="grid gap-5">
      <div class="space-y-1">
        <p class="text-xs font-medium uppercase tracking-wide text-primary/80">Programme</p>
        <h2 class="text-2xl font-semibold text-highlighted">À venir</h2>
      </div>

      <template v-if="props.spotlight">
        <div class="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div class="flex flex-wrap items-center gap-2">
            <UBadge :color="isScheduleItemLive(props.spotlight) ? 'success' : props.spotlight.special ? 'warning' : 'primary'"
                    variant="soft">
              {{ isScheduleItemLive(props.spotlight) ? "En direct" : props.spotlight.special ? "Temps fort" : "À venir" }}
            </UBadge>
            <UBadge color="neutral" variant="soft">
              {{ props.spotlight.dateString }}
            </UBadge>
          </div>

          <div class="mt-4 grid gap-2">
            <p class="text-xl font-semibold text-highlighted">{{ props.spotlight.title }}</p>
            <p class="text-sm leading-relaxed text-muted">{{ props.spotlight.description }}</p>
          </div>

          <p class="mt-4 text-sm text-muted">
            {{ $dayjs(props.spotlight.startTime).format("H[h]mm") }} - {{ $dayjs(props.spotlight.endTime).format("H[h]mm") }}
          </p>
        </div>

        <div v-if="props.secondaryItems.length" class="grid gap-3">
          <div v-for="item in props.secondaryItems" :key="item.id"
               class="rounded-lg bg-elevated px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-medium text-highlighted">{{ item.title }}</p>
                <p class="text-sm text-muted">{{ item.dateString }}</p>
              </div>
              <p class="shrink-0 text-sm text-muted">
                {{ $dayjs(item.startTime).format("H[h]mm") }}
              </p>
            </div>
          </div>
        </div>
      </template>

      <UAlert v-else color="neutral" variant="soft" icon="i-lucide-calendar-fold"
              title="Programme indisponible"
              description="Le prochain temps fort apparaîtra ici dès qu'il sera configuré."/>
    </div>
  </UCard>
</template>
