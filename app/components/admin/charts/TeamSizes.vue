<script setup lang="ts">
const props = defineProps<{
  includeParticipantStats: boolean;
}>();

const {data: teams, status, refresh} = await useTeams({lazy: true});

const distribution = computed(() => getTeamSizeDistribution(teams.value ?? []));
const validTeams = computed(() => props.includeParticipantStats ? teams.value?.filter(isTeamValid).length ?? 0 : 0);
const undersizedTeams = computed(() => teams.value?.filter(team => team.members.length < TEAM_MINIMUM_MEMBERS).length ?? 0);
const formatCount = (value: number) => Number.isInteger(value) ? value.toLocaleString("fr-BE") : "";

useRefreshOnPageReturn(refresh);
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div class="flex flex-col gap-1">
          <h2 class="font-semibold text-highlighted">Formation des équipes</h2>
          <p v-if="status === 'success'" class="text-sm text-muted">
            {{ teams?.length ?? 0 }} équipe{{ (teams?.length ?? 0) > 1 ? "s" : "" }} · par nombre de membres
          </p>
        </div>
        <UButton v-if="includeParticipantStats" to="/admin/teams" label="Équipes" color="neutral" variant="link"
                 trailing-icon="i-lucide-arrow-up-right" size="sm"/>
      </div>
    </template>

    <USkeleton v-if="status === 'pending' || status === 'idle'" class="h-72 rounded-lg"/>

    <UAlert v-else-if="status === 'error'" title="Les équipes sont indisponibles." icon="i-lucide-circle-alert"
            color="error" variant="subtle" :actions="[{label: 'Réessayer', onClick: () => refresh()}]"/>

    <template v-else-if="teams?.length">
      <UChart type="bar" :data="distribution" index="label" :height="220" :format="formatCount"
              :categories="[{key: 'count', label: 'Équipes', color: 'primary'}]"
              aria-label="Répartition des équipes par nombre de membres"/>
      <div class="mt-4 space-y-3 border-t border-default pt-4">
        <div v-if="includeParticipantStats" class="flex items-center justify-between gap-3 text-sm">
          <span class="text-muted">Équipes valides</span>
          <span class="font-semibold text-highlighted tabular-nums">
            {{ validTeams }} / {{ teams.length }}
          </span>
        </div>
        <UProgress v-if="includeParticipantStats" :model-value="validTeams" :max="teams.length"
                   aria-label="Part des équipes valides" color="primary" size="sm"/>
        <p class="text-xs text-muted">
          Équipes avec moins de {{ TEAM_MINIMUM_MEMBERS }} membres : {{ undersizedTeams }}.
          <template v-if="includeParticipantStats">
            La validité tient compte du nombre de membres et du règlement des cautions.
          </template>
        </p>
      </div>
    </template>

    <UEmpty v-else icon="i-lucide-users" title="Aucune équipe pour le moment"
            description="La répartition apparaîtra dès la création des premières équipes." class="min-h-60"/>
  </UCard>
</template>
