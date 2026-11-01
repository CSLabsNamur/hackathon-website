import type { ColumnFiltersState } from "@tanstack/vue-table";
import { type MaybeRefOrGetter, toValue } from "vue";

export function useTableSelection<T extends {id: string}>(items: MaybeRefOrGetter<T[] | undefined>, globalFilter: MaybeRefOrGetter<string | undefined>) {
  const rowSelection = ref<Record<string, boolean>>({});
  const columnFilters = ref<ColumnFiltersState>([]);
  const selectedItems = computed(() => (toValue(items) ?? []).filter((item) => rowSelection.value[item.id]));

  watch([() => toValue(globalFilter), columnFilters], () => {
    rowSelection.value = {};
  }, {deep: true});
  watch(() => toValue(items), (currentItems) => {
    rowSelection.value = Object.fromEntries((currentItems ?? []).filter((item) => rowSelection.value[item.id]).map((item) => [item.id, true]));
  });

  return {rowSelection, columnFilters, selectedItems};
}
