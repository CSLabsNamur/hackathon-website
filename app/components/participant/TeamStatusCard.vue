<script setup lang="ts">
const props = defineProps<{ team: CurrentParticipantTeam }>();

const { data: submissionsRequests } = await useSubmissionsRequests();

const validation = computed(() => getTeamValidationResult(props.team, submissionsRequests.value));

const teamIssues = computed(() => validation.value.issues);
const highestSeverity = computed(() => validation.value.highestSeverity);

const iconsSeverityMap = {
  info: "i-lucide-info-circle",
  warning: "i-lucide-alert-triangle",
  error: "i-lucide-circle-x",
};

const colorsSeverityMap = (severity: typeof highestSeverity.value) => {
  return {
    "text-blue-500": severity === "info",
    "text-orange-500": severity === "warning",
    "font-semibold text-red-500": severity === "error",
  };
};

const statusIcon = computed(() => teamIssues.value.length === 0 ? "i-lucide-circle-check-big" : iconsSeverityMap[highestSeverity.value]);
const statusColor = computed(() => teamIssues.value.length === 0
  ? { "font-semibold text-green-500": true }
  : colorsSeverityMap(highestSeverity.value),
);
</script>

<template>
  <UCard>
    <div class="grid gap-3 place-items-center justify-items-center">
      <UIcon :name="statusIcon" class="text-6xl" :class="statusColor"/>
      <div v-auto-animate class="text-center">
        <template v-if="teamIssues.length === 0">
          <p class="font-medium text-green-600">Votre équipe est valide.</p>
          <p class="text-sm text-muted">Tous les points bloquants sont actuellement levés.</p>
        </template>
        <template v-else>
          <div v-auto-animate class="flex flex-col gap-3 text-left">
            <template v-for="(issue, index) in teamIssues" :key="`issue-${index}`">
              <div>
                <p :class="colorsSeverityMap(issue.severity)">{{ issue.message }}</p>
                <p v-if="issue.description" class="text-sm text-muted">{{ issue.description }}</p>
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>
  </UCard>
</template>
