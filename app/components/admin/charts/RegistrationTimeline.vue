<script setup lang="ts">
const props = defineProps<{
  participants: AdminParticipant[];
}>();

const now = useNow({scheduler: callback => useIntervalFn(callback, 60000)});

const period = ref(0);
const periods = [
  {label: "30 derniers jours", value: 30},
  {label: "90 derniers jours", value: 90},
  {label: "Tout l'historique", value: 0},
];
const timeline = computed(() => getRegistrationTimeline(props.participants, period.value, now.value));

const formatCount = (value: number) => Number.isInteger(value) ? value.toLocaleString("fr-BE") : "";
</script>

<template>
  <UCard :ui="{body: 'sm:p-6'}">
    <template #header>
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="flex flex-col gap-1">
          <h2 class="font-semibold text-highlighted">Rythme des inscriptions</h2>
          <p class="text-sm text-muted">
            {{ timeline.total }} inscription{{ timeline.total > 1 ? "s" : "" }} sur la période ·
            {{ timeline.weekly ? "par semaine" : "par jour" }}
          </p>
        </div>
        <USelect v-model="period" :items="periods" aria-label="Période des inscriptions"
                 class="w-full sm:w-48"/>
      </div>
    </template>

    <UChart v-if="timeline.total" type="bar" :data="timeline.data" index="date"
            :categories="[{key: 'count', label: 'Inscriptions', color: 'primary'}]"
            :height="280" :format="formatCount" aria-label="Nombre d'inscriptions au fil du temps"/>
    <UEmpty v-else icon="i-lucide-calendar-search" title="Aucune inscription sur cette période"
            description="Les inscriptions apparaîtront ici au fur et à mesure." class="h-70"/>

    <template #footer>
      <p class="text-xs text-muted">
        Participants actuellement inscrits, selon leur date d'inscription.
        <template v-if="timeline.weekly">
          Les semaines aux extrémités peuvent être partielles.
        </template>
      </p>
    </template>
  </UCard>
</template>
