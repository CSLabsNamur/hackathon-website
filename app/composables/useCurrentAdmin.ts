export const useCurrentAdmin = async () => {
  return useFetch<CurrentAdmin>("/api/admins/me", {
    //server: false,
    credentials: "same-origin",
  });
};
