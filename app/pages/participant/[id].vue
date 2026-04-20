<script setup lang="ts">
import type { ParticipantPublicProfile } from "#shared/utils/types";

definePageMeta({
  layout: "default",
  middleware: "user-auth",
});

const route = useRoute();
const routeParticipantId = route.params.id;

if (!routeParticipantId) {
  throw createError({statusCode: 404, statusMessage: "Participant introuvable"});
}

const {data: currentParticipant} = await useCurrentParticipant();

const {data: profile, status} = await useAPI<ParticipantPublicProfile>(`/api/participants/${routeParticipantId}`);
const {downloadParticipantCv} = useParticipantsActions();

const avatarUrl = computed(() => getAvatarUrl(profile));

const githubUrl = computed(() => profile.value?.githubAccount ? getParticipantGithubUrl(profile.value.githubAccount) : null);
const linkedInUrl = computed(() => profile.value?.linkedInAccount ? getParticipantLinkedInUrl(profile.value.linkedInAccount) : null);

useSeoMeta({
  title: () => profile.value ? `${profile.value.user.firstName} ${profile.value.user.lastName} | Profil participant` : "Profil participant",
});
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <div class="flex items-center justify-center">
      <UCard v-if="status === 'pending'">
        <USkeleton class="h-64 w-full"/>
      </UCard>

      <UAlert v-else-if="status === 'error'" color="error" variant="soft" icon="i-lucide-alert-circle"
              title="Profil indisponible"
              description="Ce profil n'a pas pu être chargé ou n'existe pas."/>

      <UCard v-else-if="profile" :ui="{body: 'p-6 sm:p-7'}" class="w-full max-w-3xl">
        <template #header>
          <div class="flex flex-wrap items-center gap-4">
            <UAvatar :src="avatarUrl" :alt="`${profile.user.firstName} ${profile.user.lastName}`" size="3xl"
                     :ui="{root: 'bg-primary', fallback: 'text-highlighted'}"/>
            <div class="grid gap-1">
              <h1 class="text-2xl font-semibold text-highlighted">
                {{ profile.user.firstName }} {{ profile.user.lastName }}
              </h1>
              <p v-if="profile.team" :title="profile.team.name" class="text-base truncate">
                {{ profile.team.name }}
              </p>
            </div>
          </div>
        </template>

        <div class="grid gap-4 sm:grid-cols-2 *:w-full">
          <ParticipantProfileLabel label="École / Université" icon="i-lucide-graduation-cap" :value="profile.school"/>

          <ParticipantProfileLabel label="CV" icon="i-lucide-file-user" :value="profile.curriculumVitae">
            <UButton size="xs" variant="ghost" icon="i-lucide-download"
                     @click="downloadParticipantCv(profile.curriculumVitae)">
              Télécharger
            </UButton>
          </ParticipantProfileLabel>

          <ParticipantProfileLabel label="GitHub" icon="i-simple-icons-github" :value="profile.githubAccount"
                                   :url="githubUrl"/>

          <ParticipantProfileLabel label="LinkedIn" icon="i-simple-icons-linkedin" :value="profile.linkedInAccount"
                                   :url="linkedInUrl"/>
        </div>

        <template v-if="currentParticipant?.id === profile.id" #footer>
          <p class="text-xs text-muted text-center">
            Cette page n'est visible que par les autres participants et les membres du staff.
          </p>
        </template>
      </UCard>
    </div>
  </UContainer>
</template>