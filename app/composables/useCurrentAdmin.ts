export const useCurrentAdmin = async () => {
  return useFetch<CurrentAdmin>("/api/admins/me", {
    key: "current-admin",
    credentials: "same-origin",
    dedupe: "defer",
  });
};
