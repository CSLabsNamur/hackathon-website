<script setup lang="ts">
import { VueDraggable } from "vue-draggable-plus";

const props = defineProps<{
  room: Room,
  isModifying: boolean,
  hideHandle?: boolean
}>();
const emit = defineEmits<{ "update:teams": [teams: AdminTeamWithoutRelations[]] }>();

const teamsModel = computed({
  get: () => props.room.teams,
  set: (teams: Room["teams"]) => emit("update:teams", teams),
});
</script>

<template>
  <UPageCard :id="room.id === 'unassigned' ? undefined : `room-${room.id}`"
             :ui="{body: 'p-6 md:p-8 w-full'}" class="w-72 min-h-72 self-start">
    <template #header>
      <div class="flex min-w-0 items-center justify-center gap-2.5 text-center">
        <UIcon v-if="isModifying && !hideHandle" name="i-lucide-grip-vertical" class="handle"/>
        <div class="truncate text-lg font-semibold">
          {{ room.name }}
        </div>
      </div>
    </template>
    <template v-if="room.teams" #body>
      <div class="group/room relative min-h-32 w-full">
        <VueDraggable :key="`teams-${isModifying}`" v-model="teamsModel" group="teams" :animation="150"
                      ghost-class="ghost" draggable=".team-card" :disabled="!isModifying"
                      class="grid min-h-32 max-h-80 w-full grid-cols-2 content-start justify-items-center gap-x-5 gap-y-6 overflow-y-auto overflow-x-hidden">
          <div v-for="team in teamsModel" :key="team.id" class="team-card flex w-full justify-center"
               :class="{'col-span-2': teamsModel.length === 1}">
            <div class="flex w-full max-w-24 flex-col items-center gap-2 text-center" :title="team.name">
              <div class="flex size-11 items-center justify-center rounded-full bg-elevated/70">
                <UIcon name="i-lucide-users" class="size-6 shrink-0"/>
              </div>
              <div class="w-full wrap-break-word text-center text-xs leading-4 font-medium">
                {{ team.name }}
              </div>
            </div>
          </div>
        </VueDraggable>
        <div v-if="teamsModel.length === 0"
             class="group-has-[.ghost]/room:hidden pointer-events-none absolute inset-0 flex min-h-32 w-full items-center
                    justify-center px-4 text-center text-sm text-muted select-none">
          <span class="block w-full">Aucune équipe assignée</span>
        </div>
      </div>
    </template>
  </UPageCard>
</template>
