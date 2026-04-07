import type { CurrentUser } from "#shared/utils/types";

export const useCurrentUser = async () => {
  return useFetch<CurrentUser | null>("/api/me", {
    key: "current-user",
    credentials: "same-origin",
    dedupe: "defer",
  });
};
