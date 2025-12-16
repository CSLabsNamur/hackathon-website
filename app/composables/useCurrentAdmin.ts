export const useCurrentAdmin = async () => {
  return useAPI("/api/admins/me", {
    //server: false,
    credentials: "same-origin",
  });
};
