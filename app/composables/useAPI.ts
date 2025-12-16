import type { UseFetchOptions } from "nuxt/app";
import type { NitroFetchRequest } from "nitropack/types";

export function useAPI<T>(
  url: NitroFetchRequest,
  options?: UseFetchOptions<T>,
) {
  return useFetch(url, {
    ...options,
    $fetch: useNuxtApp().$api as typeof $fetch,
  });
}
