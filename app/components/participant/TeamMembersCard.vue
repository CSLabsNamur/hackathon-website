<script setup lang="ts">
const props = defineProps<{ members: CurrentParticipantTeamMember[] }>();

const membersWithLinks = computed(() => props.members.map((member) => ({
  ...member,
  name: `${member.user.firstName} ${member.user.lastName}`,
  githubUrl: member.githubAccount ? getParticipantGithubUrl(member.githubAccount) : null,
  linkedInUrl: member.linkedInAccount ? getParticipantLinkedInUrl(member.linkedInAccount) : null,
})));
</script>

<template>
  <UCard :ui="{body: 'p-0 sm:p-0'}">
    <template #header>
      <h2 class="text-lg font-semibold text-highlighted">Membres</h2>
    </template>

    <ul v-if="membersWithLinks.length" class="divide-y divide-default">
      <li v-for="member in membersWithLinks" :key="member.id"
          class="flex flex-wrap items-center gap-3 p-4 sm:p-6">
        <UAvatar :alt="member.name" size="md"/>
        <div class="min-w-0 flex-1 grid gap-1">
          <NuxtLink :to="`/participant/${member.id}`"
                    class="font-medium text-highlighted hover:text-primary wrap-anywhere">
            {{ member.name }}
          </NuxtLink>
          <p v-if="member.school" class="text-sm text-muted wrap-anywhere">{{ member.school }}</p>
        </div>
        <div v-if="member.githubUrl || member.linkedInUrl" class="flex gap-1">
          <UButton v-if="member.githubUrl" :to="member.githubUrl" target="_blank" external
                   color="neutral" variant="ghost" icon="i-simple-icons-github"
                   :aria-label="`GitHub de ${member.name}`"/>
          <UButton v-if="member.linkedInUrl" :to="member.linkedInUrl" target="_blank" external
                   color="neutral" variant="ghost" icon="i-simple-icons-linkedin"
                   :aria-label="`LinkedIn de ${member.name}`"/>
        </div>
      </li>
    </ul>

    <UEmpty v-else title="Aucun membre dans l'équipe" icon="i-lucide-users" class="border-0"
            description="Partagez le code d'invitation pour rejoindre cette équipe."/>
  </UCard>
</template>
