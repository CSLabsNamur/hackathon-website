<script setup lang="ts">
const props = defineProps<{ participant: CurrentParticipant }>();

const githubUrl = computed(() => props.participant.githubAccount
    ? getParticipantGithubUrl(props.participant.githubAccount) : null,
);
const linkedInUrl = computed(() => props.participant.linkedInAccount
    ? getParticipantLinkedInUrl(props.participant.linkedInAccount) : null,
);
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-lg font-semibold text-highlighted">Informations personnelles</h2>
    </template>

    <div class="grid gap-6 sm:grid-cols-2">
      <ParticipantProfileLabel label="Adresse e-mail" icon="i-lucide-at-sign" :value="participant.user.email"/>
      <ParticipantProfileLabel label="École / Université" icon="i-lucide-graduation-cap" :value="participant.school"/>
      <ParticipantProfileLabel label="Compte GitHub" icon="i-simple-icons-github" :value="participant.githubAccount"
                               :url="githubUrl"/>
      <ParticipantProfileLabel label="Compte LinkedIn" icon="i-simple-icons-linkedin" :url="linkedInUrl"
                               :value="participant.linkedInAccount"/>
    </div>
  </UCard>
</template>
