import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";
import type { Column, Row, VisibilityState } from "@tanstack/vue-table";
import type { Ref } from "vue";
import { UButton, UDropdownMenu } from "#components";
import type { TableColumn } from "@nuxt/ui";

// For tables, we often want to have a "name" property for columns, which is not part of the TableColumn type.
// If we use dynamic headers, we cannot get the name from the column definition, but we need it for the column visibility menu, for example.
export type NamedTableColumn<T> = TableColumn<T> & { id: string; name?: string };

type FilterHeaderItem<TValue extends string> = {
  label: string;
  value: TValue;
};

export function getStrSortedHeader<T>(column: Column<T>, label: string) {
  const isSorted = column.getIsSorted();

  return h(
    UDropdownMenu,
    {
      content: {
        align: "start",
      },
      "aria-label": "Actions dropdown",
      items: [
        {
          label: "Asc",
          type: "checkbox",
          icon: "i-lucide-arrow-up-narrow-wide",
          checked: isSorted === "asc",
          onSelect: () => {
            if (isSorted === "asc") {
              column.clearSorting();
            } else {
              column.toggleSorting(false);
            }
          },
        },
        {
          label: "Desc",
          icon: "i-lucide-arrow-down-wide-narrow",
          type: "checkbox",
          checked: isSorted === "desc",
          onSelect: () => {
            if (isSorted === "desc") {
              column.clearSorting();
            } else {
              column.toggleSorting(true);
            }
          },
        },
      ],
    },
    () =>
      h(UButton, {
        color: "neutral",
        variant: "ghost",
        label,
        icon: isSorted
          ? isSorted === "asc"
            ? "i-lucide-arrow-up-narrow-wide"
            : "i-lucide-arrow-down-wide-narrow"
          : "i-lucide-arrow-up-down",
        class: "-mx-2.5 data-[state=open]:bg-elevated",
        "aria-label": `Sort by ${isSorted === "asc" ? "descending" : "ascending"}`,
      }),
  );
}

export function getSingleSelectFilterHeader<T, TValue extends string>(column: Column<T>, label: string, items: FilterHeaderItem<TValue>[], ariaLabel = `Filtrer la colonne ${label.toLowerCase()}`) {
  const selectedValue = column.getFilterValue() as TValue | undefined;
  const selectedItem = items.find(item => item.value === selectedValue);
  const dropdownItems: DropdownMenuItem[] = items.map((item) => ({
    label: item.label,
    type: "checkbox",
    checked: selectedValue === item.value,
    onUpdateChecked: (checked: boolean) => {
      column.setFilterValue(checked ? item.value : undefined);
    },
  }));

  return h(
    UDropdownMenu,
    {
      content: {
        align: "start",
      },
      "aria-label": ariaLabel,
      items: dropdownItems,
    },
    () =>
      h(UButton, {
        color: "neutral",
        variant: "ghost",
        label,
        icon: selectedValue ? "i-lucide-filter-x" : "i-lucide-filter",
        class: "-mx-2.5 data-[state=open]:bg-elevated",
        "aria-label": `Filtrer par ${label.toLowerCase()}, actuellement ${selectedItem?.label || "aucun filtre"}`,
      }),
  );
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

export function useColumnVisibilityDropdownItems<T>(columns: NamedTableColumn<T>[], columnVisibility: Ref<VisibilityState>) {
  return computed<DropdownMenuItem[]>(() => {
    const dropdownItems: DropdownMenuItem[] = columns
      .filter((column) => column.id && column.enableHiding !== false)
      .map((column) => ({
        label: column.name || column.id,
        type: "checkbox",
        checked: columnVisibility.value[column.id] !== false,
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
