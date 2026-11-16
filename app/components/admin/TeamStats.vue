<script setup lang="ts">
const props = withDefaults(defineProps<{
  includeParticipantDerivedStats?: boolean;
}>(), {includeParticipantDerivedStats: true});

const {status, data: teams, refresh} = await useTeams({lazy: true});
const dayjs = useDayjs();
const {data: eventPhase} = await useEventPhase();

const latestTeam = computed(() => teams.value?.toSorted((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)))[0]);
const statCount = computed(() => props.includeParticipantDerivedStats ? 3 : 2);

const stats = computed(() => {
  const allStats = [
    {
      title: "Nombre d'équipes",
      value: teams.value?.length ?? 0,
      icon: "i-lucide-users",
      description: "Équipes actuellement inscrites",
      color: "text-primary bg-primary/10",
    },
    {
      title: "Dernière équipe créée",
      value: latestTeam.value?.name ?? "Aucune équipe",
      icon: "i-lucide-clock",
      description: "Équipe la plus récemment constituée",
      color: "text-primary bg-primary/10",
    },
  ];

  if (props.includeParticipantDerivedStats) {
    const count = teams.value?.filter((eventPhase.value === EventPhase.ENDED) ? isTeamRefunded : isTeamValid).length ?? 0;
    allStats.push({
      title: (eventPhase.value === EventPhase.ENDED) ? "Équipes remboursées" : "Équipes valides",
      value: `${count} / ${teams.value?.length ?? 0}`,
      icon: "i-lucide-wallet",
      description: (eventPhase.value === EventPhase.ENDED) ? "Tous les membres remboursés ou exonérés" : "Minimum de membres atteint et cautions réglées",
      color: "text-primary bg-primary/10",
    });
  }

  return allStats;
});

const gridClass = computed(() => statCount.value === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2");
</script>

<template>
  <div v-if="!teams && (status === 'pending' || status === 'idle')" class="grid gap-4" :class="gridClass">
    <USkeleton v-for="n in statCount" :key="n" class="h-40 rounded-xl"/>
  </div>

  <UAlert v-else-if="status === 'error'" color="error" variant="subtle"
          title="Les statistiques des équipes sont indisponibles." icon="i-lucide-circle-alert"
          :actions="[{label: 'Réessayer', onClick: () => refresh()}]"/>

  <div v-else-if="teams" class="grid gap-4" :class="gridClass">
    <UPageCard v-for="stat in stats" :key="stat.title" variant="subtle" :ui="{container: 'gap-4'}">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-medium text-muted">{{ stat.title }}</p>
        <span class="flex size-9 shrink-0 items-center justify-center rounded-lg" :class="stat.color">
          <UIcon :name="stat.icon" class="size-5"/>
        </span>
      </div>
      <p class="text-3xl font-semibold tracking-tight text-highlighted tabular-nums wrap-break-word">
        {{ stat.value }}
      </p>
      <p class="text-xs text-muted">{{ stat.description }}</p>
    </UPageCard>
  </div>
</template>
