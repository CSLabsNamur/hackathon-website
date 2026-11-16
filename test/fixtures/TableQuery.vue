<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { useTemplateRef } from "vue";
import UTable from "#ui/components/Table.vue";
import { useTableQuery } from "../../app/composables/useTableQuery";
import { useSearchQuery } from "../../app/composables/useSearchQuery";
import { getColumnHeader } from "../../app/utils/tables";

const rows = [{name: "Alice", caution: "PAID"}, {name: "Bob", caution: "NOT_PAID"}, {name: "Carol", caution: "PAID"}];
const {sorting, columnFilters} = useTableQuery({sort: ["name"], filters: {caution: ["PAID", "NOT_PAID"]}});
const search = useSearchQuery();
const columns: TableColumn<typeof rows[number]>[] = [
  {id: "name", accessorKey: "name", header: ({column}) => getColumnHeader(column, "Nom", {sort: true})},
  {id: "caution", accessorKey: "caution", filterFn: "equalsString", enableGlobalFilter: false, header: ({column}) => getColumnHeader(column, "Caution", {filters: [{label: "Payé", value: "PAID"}, {label: "Non payé", value: "NOT_PAID"}]})},
];
const table = useTemplateRef("table");
defineExpose({table});
</script>

<template>
  <UTable ref="table" v-model:sorting="sorting" v-model:column-filters="columnFilters"
          v-model:global-filter="search" :columns="columns" :data="rows"/>
</template>
