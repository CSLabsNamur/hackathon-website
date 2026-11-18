<script setup lang="ts">
const props = defineProps<{ participant: CurrentParticipant }>();

const {canPermissions} = useAbility(() => props.participant);
const canReadRequests = computed(() => canPermissions(["submissionRequests.read"]));

const requestsState = canReadRequests.value ? await useSubmissionsRequests({lazy: true}) : null;
const submissionsStatus = computed(() => canReadRequests.value ? requestsState?.status.value : undefined);
const teamIssues = computed(() => props.participant.team
    ? getTeamValidationIssues(props.participant.team, canReadRequests.value ? requestsState?.data.value : undefined)
    : [],
);

const refreshRequests = () => {
  if (canReadRequests.value) return requestsState?.refresh();
};

useRefreshOnPageReturn(refreshRequests);
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold text-highlighted">Situation de l'équipe</h2>
    </template>

    <div class="grid gap-3">
      <UAlert v-for="issue in teamIssues" :key="issue.code" variant="soft"
              :color="issue.severity === 'error' ? 'error' : 'warning'"
              icon="i-lucide-circle-alert" :title="issue.message" :description="issue.description"/>

      <UAlert v-if="submissionsStatus === 'error'" color="warning" variant="soft"
              icon="i-lucide-circle-alert" title="Vérification des dépôts indisponible"
              description="Le statut des livrables de l'équipe n'a pas pu être vérifié."
              :actions="[{label: 'Réessayer', color: 'warning', variant: 'soft', onClick: refreshRequests}]"/>

      <USkeleton v-else-if="canReadRequests && submissionsStatus !== 'success'" class="h-20"/>

      <UAlert v-else-if="!teamIssues.length" color="success" variant="soft"
              icon="i-lucide-circle-check"
              :title="canReadRequests ? 'Aucun point à corriger' : 'Effectif et cautions en ordre'"/>
    </div>
  </UCard>
</template>
