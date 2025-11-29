interface UseTeamsParams {
  lazy?: boolean;
}

export const useTeams = async (params?: UseTeamsParams) => {
  const {status, data, refresh} = useFetch("/api/teams", {
    lazy: params?.lazy ?? false,
    //cache: "force-cache",
  });

  return {data, status, refresh};
};
