<script setup lang="ts">
const props = defineProps<{ participant: CurrentParticipant }>();

const {data: submissionsRequests} = await useSubmissionsRequests({lazy: true});

// TODO: obviously move there functions elsewhere
enum TeamIssueSeverity {
  INFO = 0,
  WARNING = 1,
  ERROR = 2,
}

type TeamIssue = {
  severity: TeamIssueSeverity;
  message: string;
  description?: string;
};

const teamIssues = computed<TeamIssue[]>(() => {
  const issues: TeamIssue[] = [];

  if (props.participant.team!.members.some(member => {
    return member.caution === CautionStatus.NOT_PAID;
  })) {
    issues.push({
      severity: TeamIssueSeverity.ERROR,
      message: "Personne n'a encore payé sa caution.",
      description: "Votre équipe ne sera pas validée tant qu'au moins un membre n'aura pas payé sa caution.",
    });
  }
  if (props.participant.team!.members.length < 2) {
    issues.push({
      severity: TeamIssueSeverity.WARNING,
      message: "Votre équipe est incomplète.",
      description: `Il manque ${2 - props.participant.team!.members.length} membre(s) pour atteindre le nombre minimum de 2 membres.`,
    });
  }
  // Check if all members have submitted every required submission
  if (!props.participant.team?.members.every((member) => {
    return submissionsRequests.value?.every((request) => !request.required || member.submissions?.some((submission) => submission.requestId === request.id));
  })) {
    issues.push({
      severity: TeamIssueSeverity.WARNING,
      message: "Certains membres n'ont pas encore soumis tous les livrables requis demandés.",
      description: "Assurez-vous que tous les membres de votre équipe ont soumis les livrables requis.",
    });
  }

  return issues;
});

const highestSeverity = computed(() => teamIssues.value?.reduce((max, issue) => Math.max(max, issue.severity), TeamIssueSeverity.INFO) as TeamIssueSeverity);

const iconsSeverityMap = {
  [TeamIssueSeverity.INFO]: "i-lucide-info-circle",
  [TeamIssueSeverity.WARNING]: "i-lucide-alert-triangle",
  [TeamIssueSeverity.ERROR]: "i-lucide-circle-x",
};
const colorsSeverityMap = (severity: TeamIssueSeverity) => {
  return {
    "text-blue-500": severity === TeamIssueSeverity.INFO,
    "text-orange-500": severity === TeamIssueSeverity.WARNING,
    "font-semibold text-red-500": severity === TeamIssueSeverity.ERROR,
  };
};
</script>

<template>
  <UCard>
    <div class="grid gap-3 place-items-center justify-items-center">
      <UIcon :name="iconsSeverityMap[highestSeverity]" class="text-6xl" :class="colorsSeverityMap(highestSeverity)"/>
      <div class="text-center">
        <template v-if="teamIssues.length === 0">
          <p class="text-muted">Votre équipe est en bonne santé ! 🎉</p>
        </template>
        <template v-else>
          <div class="flex flex-col gap-0.5">
            <template v-for="(issue, index) in teamIssues" :key="`issue-${index}`">
              <p :class="colorsSeverityMap(issue.severity)">
                {{ issue.message }}
              </p>
            </template>
          </div>
        </template>
      </div>
    </div>
  </UCard>
</template>
