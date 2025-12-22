import type { CreateTeamSchema } from "#shared/schemas/teams/create";
import type { EditTeamSchema } from "#shared/schemas/teams/edit";
import type { JoinTeamSchema } from "#shared/schemas/teams/join";

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
  const {$api} = useNuxtApp();

  // TODO: Move this in something like useCurrentTeam
  const createTeam = async (data: CreateTeamSchema) => {
    return $api("/api/teams/me", {
      method: "POST",
      body: data,
    });
  };

  // Participant action (self-edit)
  // TODO: Move this in something like useCurrentTeam
  const editMyTeam = async (data: EditTeamSchema) => {
    return $api("/api/teams/me", {
      method: "PUT",
      body: data,
    });
  };

  // Admin action (edit any team)
  const editTeam = async (id: string, data: EditTeamSchema) => {
    return $api(`/api/teams/${id}`, {
      method: "PUT",
      body: data,
    });
  };

  // TODO: Move this in something like useCurrentTeam
  const joinTeam = async (token: JoinTeamSchema) => {
    return $api(`/api/teams/me/join`, {
      method: "POST",
      body: token,
    });
  };

  const removeTeam = async (id: string) => {
    return $api(`/api/teams/${id}`, {
      //@ts-expect-error wtf?
      method: "DELETE",
    });
  };

  return {
    createTeam,
    editMyTeam,
    editTeam,
    joinTeam,
    removeTeam,
  };
};
