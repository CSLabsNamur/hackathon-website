import { useRouteQuery } from "@vueuse/router";
import { computed } from "vue";

export const useSearchQuery = () => {
  const search = useRouteQuery("search");
  return computed({
    get: () => (Array.isArray(search.value) ? search.value[0] : search.value) ?? "",
    set: (value: string) => {
      search.value = value || undefined;
    },
  });
};
