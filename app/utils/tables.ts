import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";
import type { Column, Row, VisibilityState } from "@tanstack/vue-table";
import { type MaybeRefOrGetter, type Ref, toValue } from "vue";
import { UButton, UCheckbox, UDropdownMenu } from "#components";
import type { TableColumn } from "@nuxt/ui";

// For tables, we often want to have a "name" property for columns, which is not part of the TableColumn type.
// If we use dynamic headers, we cannot get the name from the column definition, but we need it for the column visibility menu, for example.
export type NamedTableColumn<T> = TableColumn<T> & { id: string; name?: string };

type FilterHeaderItem = { label: string; value: string };
type ColumnHeaderOptions = { sort?: boolean; filters?: FilterHeaderItem[] };

export function getWrappingColumnMeta() {
  return {
    class: {
      td: "whitespace-normal [overflow-wrap:anywhere]",
    },
  };
}

export function getColumnHeader<T>(column: Column<T>, label: string, {sort = false, filters}: ColumnHeaderOptions) {
  const direction = column.getIsSorted();
  const selectedValue = column.getFilterValue();
  const selectedItem = filters?.find(item => item.value === selectedValue);

  const sortIcons = {
    asc: "i-lucide-arrow-up-narrow-wide",
    desc: "i-lucide-arrow-down-wide-narrow",
    none: "i-lucide-arrow-up-down",
  };

  const items: DropdownMenuItem[][] = [];
  const states: string[] = [];

  if (sort) {
    items.push([
      {type: "label", label: "Tri"},
      {
        label: "Trier A → Z",
        type: "checkbox",
        icon: sortIcons.asc,
        checked: direction === "asc",
        onUpdateChecked: (checked: boolean) => checked ? column.toggleSorting(false) : column.clearSorting(),
      },
      {
        label: "Trier Z → A",
        type: "checkbox",
        icon: sortIcons.desc,
        checked: direction === "desc",
        onUpdateChecked: (checked: boolean) => checked ? column.toggleSorting(true) : column.clearSorting(),
      },
    ]);
    states.push(`tri : ${direction === "asc" ? "croissant" : direction === "desc" ? "décroissant" : "aucun tri"}`);
  }
  if (filters) {
    items.push([
      {type: "label", label: "Filtre"},
      ...filters.map(item => ({
        label: item.label,
        type: "checkbox" as const,
        checked: selectedValue === item.value,
        onUpdateChecked: (checked: boolean) => column.setFilterValue(checked ? item.value : undefined),
      })),
    ]);
    states.push(`filtre : ${selectedItem?.label || "aucun filtre"}`);
  }

  const action = sort ? (filters ? "Trier et filtrer" : "Trier") : "Filtrer";
  const ariaLabel = `${action} par ${label.toLowerCase()}, ${states.join(", ")}`;

  return h(UDropdownMenu, {content: {align: "start"}, "aria-label": ariaLabel, items}, () => h(UButton, {
    color: selectedItem ? "primary" : "neutral",
    variant: "ghost",
    label,
    icon: sort ? sortIcons[direction || "none"] : "i-lucide-filter",
    trailingIcon: sort && selectedItem ? "i-lucide-filter" : undefined,
    class: "-mx-2.5 data-[state=open]:bg-elevated",
    "aria-label": ariaLabel,
  }));
}

export function getRowExpandButton<T>(row: Row<T>, expandedAriaLabel: string, collapsedAriaLabel: string) {
  return h(UButton, {
    color: "neutral",
    variant: "ghost",
    icon: "i-lucide-chevron-down",
    square: true,
    "aria-label": row.getIsExpanded() ? expandedAriaLabel : collapsedAriaLabel,
    ui: {
      leadingIcon: [
        "transition-transform",
        row.getIsExpanded() ? "duration-200 rotate-180" : "",
      ],
    },
    onClick: () => row.toggleExpanded(),
  });
}

export function usePersistentColumnVisibility(storageKey: string, defaults: VisibilityState = {}) {
  return useLocalStorage<VisibilityState>(storageKey, defaults, {
    mergeDefaults: true,
  });
}

export function useColumnVisibilityDropdownItems<T>(columns: MaybeRefOrGetter<NamedTableColumn<T>[]>, columnVisibility: Ref<VisibilityState>) {
  return computed<DropdownMenuItem[]>(() => {
    const dropdownItems: DropdownMenuItem[] = toValue(columns)
      .filter((column) => column.id && column.enableHiding !== false)
      .map((column) => ({
        label: column.name || column.id,
        type: "checkbox",
        checked: columnVisibility.value[column.id] !== false,
        onSelect: (event: Event) => {
          event.preventDefault();
        },
        onUpdateChecked: (checked: boolean) => {
          columnVisibility.value = {
            ...columnVisibility.value,
            [column.id]: checked,
          };
        },
      }));

    return dropdownItems;
  });
}

export function getSelectionColumn<T>(disabled: MaybeRefOrGetter<boolean>, getLabel: (item: T) => string, selectAllLabel = "Tout sélectionner"): NamedTableColumn<T> {
  return {
    id: "select",
    enableGlobalFilter: false,
    enableHiding: false,
    enableSorting: false,
    header: ({table}) => h(UCheckbox, {
      modelValue: table.getIsSomePageRowsSelected() ? "indeterminate" : table.getIsAllPageRowsSelected(),
      "onUpdate:modelValue": (value: unknown) => table.toggleAllPageRowsSelected(!!value),
      "aria-label": selectAllLabel,
      disabled: toValue(disabled),
    }),
    cell: ({row}) => h(UCheckbox, {
      modelValue: row.getIsSelected(),
      "onUpdate:modelValue": (value: unknown) => row.toggleSelected(!!value),
      "aria-label": getLabel(row.original),
      disabled: toValue(disabled),
    }),
  };
}
