<script setup lang="ts">
const props = defineProps<{
  links?: boolean;
}>();

const {status, data: participants, refresh} = await useParticipants({lazy: true});
const {data: eventPhase} = await useEventPhase();

const now = useNow({scheduler: callback => useIntervalFn(callback, 60000)});
const dayjs = useDayjs();

const cautionBreakdown = computed(() => getCautionBreakdown(participants.value ?? []));
const countCaution = (status: string) => cautionBreakdown.value.find(item => item.status === status)?.count ?? 0;
const withoutTeam = computed(() => participants.value?.filter(participant => !participant.teamId).length ?? 0);
const recentRegistrations = computed(() => participants.value?.filter(participant => {
  const createdAt = dayjs(participant.createdAt);
  return createdAt.isAfter(dayjs(now.value).subtract(7, "day")) && !createdAt.isAfter(now.value);
}).length ?? 0);

const stats = computed(() => [
  {
    title: "Participants inscrits",
    value: participants.value?.length ?? 0,
    icon: "i-lucide-user-check",
    description: `${recentRegistrations.value} inscription${recentRegistrations.value > 1 ? "s" : ""} ces 7 derniers jours`,
    color: "text-primary bg-primary/10",
    link: props.links ? "/admin/participants" : undefined,
  },
  {
    title: (eventPhase.value === EventPhase.ENDED) ? "Cautions à rembourser" : "Cautions à régler",
    value: countCaution((eventPhase.value === EventPhase.ENDED) ? "PAID" : "NOT_PAID"),
    icon: "i-lucide-wallet",
    //description: (eventPhase.value === EventPhase.ENDED) ? "Cautions encore au statut payé" : "Participants dont la caution n'est pas réglée",
    color: "text-warning bg-warning/10",
    link: props.links ? "/admin/participants?caution=" + ((eventPhase.value === EventPhase.ENDED) ? "PAID" : "NOT_PAID") : undefined,
  },
  {
    title: "Participants sans équipe",
    value: withoutTeam.value,
    icon: "i-lucide-user-round-search",
    //description: "À accompagner dans la formation des équipes",
    color: "text-primary bg-primary/10",
    link: props.links ? "/admin/participants?team=none" : undefined,
  },
]);
</script>

<template>
  <div v-if="!participants && (status === 'pending' || status === 'idle')" class="grid gap-4 sm:grid-cols-3">
    <USkeleton v-for="n in 3" :key="n" class="h-40 rounded-xl"/>
  </div>

  <UAlert v-else-if="status === 'error'" color="error" variant="subtle"
          title="Les statistiques des participants sont indisponibles." icon="i-lucide-circle-alert"
          :actions="[{label: 'Réessayer', onClick: () => refresh()}]"/>

  <div v-else-if="participants" class="grid gap-4 sm:grid-cols-3">
    <UPageCard v-for="stat in stats" :key="stat.title" variant="subtle" :ui="{container: 'gap-4'}" :to="stat.link">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-medium text-muted">{{ stat.title }}</p>
        <span class="flex size-9 shrink-0 items-center justify-center rounded-lg" :class="stat.color">
          <UIcon :name="stat.icon" class="size-5"/>
        </span>
      </div>
      <p class="text-3xl font-semibold tracking-tight text-highlighted tabular-nums">
        {{ stat.value }}
      </p>
      <p class="text-xs text-muted">{{ stat.description }}</p>
    </UPageCard>
  </div>
</template>
