export const useCurrentParticipant = async () => {
  const {status, data, refresh} = await useFetch("/api/participants/me", {
    cache: "force-cache",
  });

  const team = data.value?.team;

  return {data, status, refresh, team};
};
