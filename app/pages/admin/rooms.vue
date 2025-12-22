<script setup lang="ts">
import { vDraggable } from "vue-draggable-plus";

definePageMeta({
  layout: "dashboard",
  middleware: "admin-auth",
});

const toast = useToast();

const {status, data: roomsOriginal, refresh} = await useRooms({lazy: true});
const {reorderRooms} = useRoomsActions();
const {data: teams} = await useTeams({lazy: false});

const {cloned: rooms, isModified} = useCloned(() => roomsOriginal.value ?? []);

const unassignedTeamsRoom = ref({
  id: "unassigned",
  name: "Équipes non assignées",
  teams: teams.value?.filter((team) => !roomsOriginal.value?.some((room) => room.teams.some((rTeam) => rTeam.id === team.id))) ?? [],
  sequence: 999,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
watchEffect(() => {
  unassignedTeamsRoom.value.teams = teams.value?.filter((team) => !roomsOriginal.value?.some((room) => room.teams.some((rTeam) => rTeam.id === team.id))) ?? [];
});

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
  } catch {
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
          <UButton variant="ghost" loading-auto
                   :icon="isModifying ? 'i-lucide-save' : 'i-lucide-edit-2'"
                   @click="isModifying ? confirm() : modify()">
            {{ isModifying ? "Confirmer" : "Modifier" }}
          </UButton>
        </template>
      </DashboardNavbar>
    </template>
    <template #body>
      <UContainer>
        <div v-if="status === 'pending'" class="flex flex-wrap gap-6">
          <UPageCard v-for="n in 4" :key="n" :ui="{body: 'p-6 md:p-8 w-full'}" class="size-72">
            <template #header>
              <USkeleton class="h-6 w-32"/>
            </template>
            <template #body>
              <div class="flex flex-col h-full items-center justify-center gap-2">
                <USkeleton class="h-12 rounded w-12"/>
                <USkeleton class="h-4 rounded w-24"/>
              </div>
            </template>
          </UPageCard>
        </div>

        <div v-else :key="`rooms-${isModifying}`"
             v-draggable="[rooms, {group: 'rooms', animation: 150, handle: '.handle', disabled: !isModifying}]"
             class="flex flex-wrap gap-6">
          <AdminRoomCard v-for="room in rooms" :key="room.id" :room="room" :is-modifying="isModifying"/>
          <AdminRoomCard v-if="teams && teams.length > 0 && status === 'success'" :room="unassignedTeamsRoom"
                         :is-modifying="isModifying" hide-handle/>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
