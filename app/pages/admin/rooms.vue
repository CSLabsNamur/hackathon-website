<script setup lang="ts">
import { vDraggable } from "vue-draggable-plus";

definePageMeta({
  layout: {
    name: "dashboard",
    props: {
      title: "Salles",
    },
  },
  middleware: "admin-auth",
  requiredPermissions: ["rooms.read", "teams.read"],
});

const {setActions} = useDashboardNavbar();
const toast = useToast();

const {status, data: roomsOriginal, refresh} = await useRooms({lazy: true});
const {data: currentAdmin} = await useCurrentAdmin();
const {reorderRooms} = useRoomsActions();
const {data: teams} = await useTeams({lazy: false});
const {can} = useAbility(currentAdmin);

const {cloned: rooms, isModified} = useCloned(() => roomsOriginal.value ?? []);
const isSaving = ref(false);
const canAssignTeamsToRooms = computed(() => can("assign", "Room"));

const assignedTeamIds = computed(() => new Set(
    rooms.value.flatMap((room) => room.teams.map((team) => team.id)),
));

const unassignedTeams = computed(() =>
    teams.value?.filter((team) => !assignedTeamIds.value.has(team.id)) ?? [],
);

const unassignedTeamsRoom = computed<Room>(() => ({
  id: "unassigned",
  name: "Équipes non assignées",
  teams: unassignedTeams.value,
  sequence: 999,
  createdAt: "",
  updatedAt: "",
}));

/**
 * Update the teams of a room with the given id, and remove these teams from other rooms.
 * This is used when a room emits an update of its teams, to update the state of the rooms accordingly.
 *
 * @param roomId the id of the room to update
 * @param nextTeams the new teams of the room, which will replace the current teams of the room, and be removed from other rooms
 */
function updateRoomTeams(roomId: string, nextTeams: TeamWithoutRelations[]) {
  const nextTeamIds = new Set(nextTeams.map((team) => team.id));

  rooms.value = rooms.value.map((room) => ({
    ...room,
    teams: room.id === roomId
        ? nextTeams
        : room.teams.filter((team) => !nextTeamIds.has(team.id)),
  }));
}

/**
 * Update the unassigned teams with the given teams, which will remove these teams from all rooms.
 * This is used when the unassigned teams room emits an update of its teams, to update the state of the rooms accordingly.
 *
 * @param nextTeams the new unassigned teams, which will replace the current unassigned teams, and be removed from all rooms
 */
function updateUnassignedTeams(nextTeams: TeamWithoutRelations[]) {
  const unassignedTeamIds = new Set(nextTeams.map((team) => team.id));

  rooms.value = rooms.value.map((room) => ({
    ...room,
    teams: room.teams.filter((team) => !unassignedTeamIds.has(team.id)),
  }));
}

const [isModifying, modify] = useToggle(false);

async function confirm() {
  if (isSaving.value) {
    return;
  }
  if (!canAssignTeamsToRooms.value) {
    isModifying.value = false;
    return;
  }

  try {
    if (!isModified.value) {
      isModifying.value = false;
      return;
    }

    isSaving.value = true;

    await reorderRooms(rooms.value.map((room) => ({
      id: room.id,
      teams: room.teams.map((team) => team.id),
    })));

    await refresh();

    toast.add({
      title: "Salles mises à jour",
      description: "L'ordre des salles et l'emplacement des équipes a été mis à jour avec succès.",
      color: "success",
    });

    isModifying.value = false;
  } catch {
    toast.add({
      title: "Erreur lors de la mise à jour",
      description: "Une erreur est survenue lors de la mise à jour des salles. Veuillez réessayer ou contacter le gérant du site de cette année.",
      color: "error",
    });
  } finally {
    isSaving.value = false;
  }
}

setActions(computed(() => [{
  variant: "ghost",
  loading: isSaving.value,
  disabled: isSaving.value || !canAssignTeamsToRooms.value,
  icon: isModifying.value ? "i-lucide-save" : "i-lucide-edit-2",
  label: isModifying.value ? "Confirmer" : "Modifier",
  onClick: () => {
    if (isModifying.value) {
      void confirm();
      return;
    }

    modify();
  },
}]));
</script>

<template>
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
         v-draggable="[rooms, {group: 'rooms', animation: 150, handle: '.handle', disabled: !isModifying || !canAssignTeamsToRooms}]"
         class="flex flex-wrap gap-6">
      <AdminRoomCard v-for="room in rooms" :key="room.id" :room="room"
                     :is-modifying="isModifying && canAssignTeamsToRooms"
                     @update:teams="updateRoomTeams(room.id, $event)"/>
      <AdminRoomCard v-if="teams && teams.length > 0 && status === 'success'" :room="unassignedTeamsRoom"
                     :is-modifying="isModifying && canAssignTeamsToRooms" hide-handle
                     @update:teams="updateUnassignedTeams"/>
    </div>
  </UContainer>
</template>
