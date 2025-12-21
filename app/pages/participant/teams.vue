<script setup lang="ts">
import type { TableColumn } from "#ui/components/Table.vue";

definePageMeta({
  layout: "user-dashboard",
  middleware: "participant-auth",
});

const {data: teams} = await useTeams({lazy: true});

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
      return row.members.length;
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
