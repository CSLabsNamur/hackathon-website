<script setup lang="ts">
import { vDraggable } from "vue-draggable-plus";

definePageMeta({
  layout: "dashboard",
});

const toast = useToast();

const {data: roomsOriginal, refresh} = await useRooms();
const {reorderRooms} = useRoomsActions();
const {status: teamsStatus, data: teams} = await useTeams();

const {cloned: rooms, isModified} = useCloned(roomsOriginal);

const [isModifying, modify] = useToggle(false);

async function confirm() {
  try {
    if (!isModified.value) {
      isModifying.value = false;
      return;
    }

    await reorderRooms(rooms.value!.map((room) => ({
      id: room.id,
      teams: room.teams.map((team) => team.id),
    })));

    toast.add({
      title: "Salles mises à jour",
      description: "L'ordre des salles et l'emplacement des équipes a été mis à jour avec succès.",
      color: "success",
    });

    isModifying.value = false;
    await refresh();
  } catch (e) {
    toast.add({
      title: "Erreur lors de la mise à jour",
      description: "Une erreur est survenue lors de la mise à jour des salles. Veuillez réessayer ou contacter le gérant du site de cette année.",
      color: "error",
    });
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <DashboardNavbar title="Salles">
        <template #right>
          <UButton variant="ghost" @click="isModifying ? confirm() : modify()"
                   :icon="isModifying ? 'i-lucide-save' : 'i-lucide-edit-2'">
            {{ isModifying ? "Confirmer" : "Modifier" }}
          </UButton>
        </template>
      </DashboardNavbar>
    </template>
    <template #body>
      <UContainer>
        <div v-draggable="[rooms, {group: 'rooms', animation: 150, handle: '.handle', disabled: !isModifying}]"
             :key="`rooms-${isModifying}`"
             class="flex flex-wrap gap-6">
          <UPageCard v-for="room in rooms" :key="room.id" :ui="{body: 'p-6 md:p-8 w-full'}" class="size-72">
            <template #header>
              <div class="flex gap-2.5 items-center">
                <UIcon v-if="isModifying" name="i-lucide-grip-vertical" class="handle"/>
                <div class="text-lg font-semibold">
                  {{ room.name }}
                </div>
              </div>
            </template>
            <template #body v-if="teams">
              <div v-draggable="[room.teams, {group: 'teams', animation: 150,
                                ghostClass: 'ghost', disabled: !isModifying}]"
                   :key="`teams-${isModifying}`"
                   class="grid grid-cols-2 h-full place-items-center justify-center group"
                   :class="{'animate-wiggle': isModifying}">
                <div v-for="team in room.teams.map(t => teams!.find(ts => ts.id === t.id)!)" :key="team.id"
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
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
