<script setup lang="ts">
import type { TableColumn } from "#ui/components/Table.vue";

definePageMeta({
  layout: {
    name: "user-dashboard",
    props: {
      title: "Autres équipes",
    },
  },
  middleware: "participant-auth",
  requiredPermissions: ["teams.read"],
});

const {status, data: teams} = await useTeams({lazy: true});

const globalFilter = ref("");
const expanded = ref({});

const columns: TableColumn<Team>[] = [
  {
    id: "expand",
    enableGlobalFilter: false,
    cell: ({row}) => {
      if (!row.original.members.length) {
        return null;
      }

      return getRowExpandButton(
          row,
          "Réduire la liste des membres",
          "Développer la liste des membres",
      );
    },
  },
  {
    id: "name",
    header: ({column}) => getStrSortedHeader(column, "Nom"),
    accessorKey: "name",
  },
  {
    header: "Description",
    accessorKey: "description",
    meta: getWrappingColumnMeta(),
  },
  {
    header: "Idée",
    accessorKey: "idea",
    meta: getWrappingColumnMeta(),
  },
];
</script>

<template>
  <UContainer>
    <div class="flex flex-col gap-1 lg:gap-2">
      <div v-if="status === 'success'" class="flex justify-between">
        <UInput v-model="globalFilter" class="max-w-sm" placeholder="Rechercher..."/>
      </div>
      <UTable v-model:expanded="expanded" v-model:global-filter="globalFilter" :columns="columns" :data="teams"
              sticky :loading="status === 'pending'" :ui="{tr: 'data-[expanded=true]:bg-elevated/50'}">
        <template #expanded="{row}">
          <div class="flex flex-wrap gap-2 p-4">
            <UBadge v-for="member in row.original.members" :key="member.id" color="neutral" variant="subtle">
              {{ member.user.firstName }} {{ member.user.lastName }}
            </UBadge>
          </div>
        </template>
      </UTable>
    </div>
  </UContainer>
</template>
