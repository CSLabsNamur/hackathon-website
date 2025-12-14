import type { EditParticipantSchema } from "#shared/schemas/participants/edit";

export const useCurrentParticipant = async () => {
  return useFetch("/api/participants/me", {
    //server: false,
    credentials: "same-origin",
    //cache: "force-cache",
  });

  //const team = fetch.data.value?.team;

  //return {...fetch, team};
};

export const useCurrentParticipantActions = () => {
  const updateParticipant = async (data: EditParticipantSchema) => {
    return $fetch("/api/participants/me", {
      method: "PUT",
      body: data,
    });
  };

  return {
    updateParticipant,
  };
};
