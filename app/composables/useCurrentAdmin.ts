export const useCurrentAdmin = async () => {
  return useFetch("/api/admins/me", {
    //server: false,
    credentials: "same-origin",
  });
};
