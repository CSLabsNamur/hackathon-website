<script setup lang="ts">
import type { TableColumn } from "#ui/components/Table.vue";
import type { BadgeProps } from "#ui/components/Badge.vue";
import type { Row } from "@tanstack/vue-table";
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";

definePageMeta({
  layout: "user-dashboard",
});

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
    accessorFn: (row: Team) => {
      return participants.filter((u) => u.team === row.id).length;
    },
  },
];
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Autres Équipes">
        <template #leading>
          <UDashboardSidebarCollapse/>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UContainer>
        <UTable :columns="columns" :data="teams" sticky/>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
