import type { CreateTeamSchema } from "#shared/schemas/teams/create";

interface UseTeamsParams {
  lazy?: boolean;
}

export const useTeams = async (params?: UseTeamsParams) => {
  return useFetch("/api/teams", {
    lazy: params?.lazy ?? false,
    //cache: "force-cache",
  });
};

export const useTeamsActions = () => {
  const createTeam = async (data: CreateTeamSchema) => {
    return $fetch("/api/teams/me", {
      method: "POST",
      body: data,
    });
  };

  const editTeam = async (id: string, data: any) => {
    return $fetch(`/api/teams/${id}`, {
      method: "PUT",
      body: data,
    });
  };

  const joinTeam = async (id: string) => {
    return $fetch(`/api/teams/me/join`, {
      method: "POST",
    });
  };

  const removeTeam = async (id: string) => {
    return $fetch(`/api/teams/${id}`, {
      //@ts-expect-error wtf?
      method: "DELETE",
    });
  };

  return {
    createTeam,
    editTeam,
    joinTeam,
    removeTeam,
  };
};
