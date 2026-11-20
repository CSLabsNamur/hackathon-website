<script setup lang="ts">
defineProps<{ team: ParticipantDirectoryTeam }>();
</script>

<template>
  <UCard>
    <template #header>
      <div class="grid gap-1">
        <h2 class="text-lg font-semibold text-highlighted wrap-anywhere">{{ team.name }}</h2>
        <p class="text-sm text-muted">
          {{ team.members.length }} membre{{ team.members.length > 1 ? "s" : "" }}
        </p>
      </div>
    </template>

    <div v-if="team.description || team.members.length" class="grid gap-4">
      <p v-if="team.description" class="text-sm text-muted whitespace-pre-line wrap-anywhere">
        {{ team.description }}
      </p>
      <ul v-if="team.members.length" class="grid gap-2">
        <li v-for="member in team.members" :key="member.id" class="flex items-center gap-2">
          <UAvatar :alt="`${member.user.firstName} ${member.user.lastName}`" size="xs"/>
          <NuxtLink :to="`/participant/${member.id}`"
                    class="min-w-0 text-sm hover:text-primary wrap-anywhere">
            {{ member.user.firstName }} {{ member.user.lastName }}
          </NuxtLink>
        </li>
      </ul>
    </div>

    <template v-if="team.room" #footer>
      <p class="flex items-center gap-2 text-sm text-muted">
        <UIcon name="i-lucide-map-pin" class="size-4 shrink-0"/>
        <span class="min-w-0 wrap-anywhere">{{ team.room.name }}</span>
      </p>
    </template>
  </UCard>
</template>
