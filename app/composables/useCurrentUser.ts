import type { CurrentUser } from "#shared/utils/types";

interface UseCurrentUserParams {
  immediate?: boolean;
  lazy?: boolean;
  server?: boolean;
}

export const useCurrentUser = async (params?: UseCurrentUserParams) => {
  return useAPI<CurrentUser | null>("/api/me", {
    key: "current-user",
    credentials: "same-origin",
    dedupe: "defer",
    immediate: params?.immediate,
    lazy: params?.lazy,
    server: params?.server,
  });
};
