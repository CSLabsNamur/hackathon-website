import type { ColumnFiltersState, SortingState } from "@tanstack/vue-table";
import { useRouteQuery } from "@vueuse/router";
import { computed, type MaybeRefOrGetter, toValue } from "vue";

type TableQueryOptions = {
  sort: readonly string[];
  filters?: Record<string, MaybeRefOrGetter<readonly string[]>>;
};

export function useTableQuery(options: TableQueryOptions) {
  const sortQuery = useRouteQuery("sort");
  const filterQueries = Object.entries(options.filters ?? {})
    .map(([id, choices]) => ({
      id,
      choices,
      query: useRouteQuery(id),
    }));

  const sorting = computed<SortingState>({
    get: () => {
      const value = Array.isArray(sortQuery.value) ? sortQuery.value[0] : sortQuery.value;
      if (typeof value !== "string") return [];

      const desc = value.startsWith("-");
      const id = desc ? value.slice(1) : value;

      return options.sort.includes(id) ? [{id, desc}] : [];
    },
    set: (value) => {
      const sort = value[0];
      sortQuery.value = sort ? `${sort.desc ? "-" : ""}${sort.id}` : undefined;
    },
  });

  const columnFilters = computed<ColumnFiltersState>({
    get: (previous) => {
      const result: ColumnFiltersState = [];

      for (const {id, choices: allowedChoices, query} of filterQueries) {
        const value = Array.isArray(query.value) ? query.value[0] : query.value;
        if (typeof value !== "string") continue;

        const choices = toValue(allowedChoices);
        const choice = choices.find(choice => choice === value)
          ?? choices.find(choice => choice.toLowerCase() === value.toLowerCase());
        if (choice !== undefined) result.push({id, value: choice});
      }

      return previous?.length === result.length && result.every((filter, index) => filter.id === previous[index]?.id && filter.value === previous[index]?.value)
        ? previous
        : result;
    },
    set: (value) => {
      for (const {id, query} of filterQueries) {
        const filter = value.find(filter => filter.id === id);
        query.value = typeof filter?.value === "string" ? filter.value : undefined;
      }
    },
  });

  return {sorting, columnFilters};
}
