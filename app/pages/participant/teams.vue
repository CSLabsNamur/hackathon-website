<script setup lang="ts">
import type { TableColumn } from "#ui/components/Table.vue";
import type { SerializeObject } from "nitropack";

definePageMeta({
  layout: "user-dashboard",
});

const {data: participants} = await useParticipants();
const {data: teams} = await useTeams();

const columns: TableColumn<Team>[] = [
  {
    header: "Nom",
    accessorKey: "name",
  },
  {
    header: "Description",
    accessorKey: "description",
  },
  {
    header: "Idée",
    accessorKey: "idea",
  },
  {
    header: "Membres",
    accessorFn: (row) => {
      return participants.value?.filter((u) => u.teamId === row.id).length;
    },
  },
];
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <DashboardNavbar title="Autres équipes"/>
    </template>
    <template #body>
      <UContainer>
        <UTable :columns="columns" :data="teams" sticky/>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
