import type { EditParticipantSchema } from "#shared/schemas/participants/edit";

export const useCurrentParticipant = async () => {
  return useFetch<CurrentParticipant>("/api/participants/me", {
    key: "current-participant",
    credentials: "same-origin",
    dedupe: "defer",
  });
};

export const useCurrentParticipantActions = () => {
  const {$api} = useNuxtApp();

  const updateParticipant = async (data: EditParticipantSchema) => {
    return $api("/api/participants/me", {
      method: "PUT",
      body: data,
    });
  };

  return {
    updateParticipant,
  };
};
