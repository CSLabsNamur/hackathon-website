<script setup lang="ts">
import { vDraggable } from "vue-draggable-plus";

defineProps<{ room: Room, isModifying: boolean, hideHandle?: boolean }>();
</script>

<template>
  <UPageCard :ui="{body: 'p-6 md:p-8 w-full'}" class="size-72">
    <template #header>
      <div class="flex gap-2.5 items-center">
        <UIcon v-if="isModifying && !hideHandle" name="i-lucide-grip-vertical" class="handle"/>
        <div class="text-lg font-semibold">
          {{ room.name }}
        </div>
      </div>
    </template>
    <template #body v-if="room.teams">
      <div
          v-draggable="[room.teams, {group: 'teams', animation: 150, ghostClass: 'ghost', disabled: !isModifying}]"
          :key="`teams-${isModifying}`"
          class="grid grid-cols-2 h-full place-items-center justify-center group"
          :class="{'animate-wiggle': isModifying}">
        <div v-for="team in room.teams.map(t => room.teams!.find(ts => ts.id === t.id)!)" :key="team.id"
             :class="{ 'col-span-2 group-[&:has(.ghost)]:col-span-1': room.teams.length === 1 }">
          <div class="grid gap-1.5 place-items-center" :title="team.name">
            <UIcon name="i-lucide-users" class="size-8"/>
            <div class="text-xs font-medium truncate w-24 text-center">
              {{ team.name }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </UPageCard>
</template>
