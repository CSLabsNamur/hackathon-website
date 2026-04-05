import type { CommandPaletteGroup, CommandPaletteItem } from "@nuxt/ui";
import { toValue } from "vue";
import type { MaybeRefOrGetter } from "vue";

export const useAdminSearch = (navigationGroups: MaybeRefOrGetter<CommandPaletteGroup<CommandPaletteItem>[]>) => {
  const searchTerm = ref("");
  const loading = ref(false);
  const resultGroups = ref<AdminSearchGroup[]>([]);
  const debouncedSearchTerm = refDebounced(searchTerm, 180);
  let latestRequestId = 0;

  watchImmediate(debouncedSearchTerm, async (value) => {
    const normalized = value.trim();

    if (normalized.length < ADMIN_SEARCH_MIN_QUERY_LENGTH) {
      latestRequestId++;
      loading.value = false;
      resultGroups.value = [];
      return;
    }

    const requestId = ++latestRequestId;
    const controller = new AbortController();
    onWatcherCleanup(() => controller.abort());

    loading.value = true;
    resultGroups.value = [];

    try {
      const response = await $fetch<AdminSearchResponse>("/api/admin/search", {
        query: {
          query: normalized,
          limit: ADMIN_SEARCH_DEFAULT_LIMIT,
        },
        signal: controller.signal,
      });

      if (requestId !== latestRequestId) {
        return;
      }

      resultGroups.value = response.groups;
      loading.value = false;
    } catch {
      if (requestId !== latestRequestId || controller.signal.aborted) {
        return;
      }

      resultGroups.value = [];
      loading.value = false;
    }
  });

  const groups = computed<CommandPaletteGroup<CommandPaletteItem>[]>(() => {
    const dynamicGroups = resultGroups.value.map((group) => ({
      id: group.id,
      label: group.label,
      ignoreFilter: true,
      items: group.items as CommandPaletteItem[],
    }));

    return [...dynamicGroups, ...toValue(navigationGroups)];
  });

  return {
    searchTerm,
    groups,
    loading,
  };
};
