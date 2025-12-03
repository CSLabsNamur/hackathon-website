export const useCurrentAdmin = async () => {
  const {status, data, refresh} = await useFetch("/api/admins/me", {
    cache: "force-cache",
  });

  return {data, status, refresh};
};
