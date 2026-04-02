import type { CautionStatus } from "~~/server/prisma/generated/prisma/enums";
import type { EditParticipantSchema } from "#shared/schemas/participants/edit";
import type { CreateParticipantSchema } from "#shared/schemas/participants/create";

interface UseParticipantsParams {
  lazy?: boolean;
}

export const useParticipants = async (params?: UseParticipantsParams) => {
  return useFetch("/api/participants", {
    lazy: params?.lazy ?? false,
    //cache: "force-cache",
  });
};

export const useParticipantsActions = () => {
  const {$api} = useNuxtApp();

  const createParticipant = async (data: CreateParticipantSchema) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined || value === null) continue;

      formData.append(key, value instanceof File ? value : String(value));
    }

    await $api("/api/participants", {
      method: "POST",
      body: formData,
    });
  };

  const updateParticipant = async (id: string, data: EditParticipantSchema) => {
    await $api(`/api/participants/${id}`, {
      method: "PUT",
      body: data,
    });
  };

  const updateCaution = async (id: string, caution: CautionStatus) => {
    return $api(`/api/participants/${id}/caution`, {
      method: "PATCH",
      body: {caution},
    });
  };

  const removeParticipant = async (id: string) => {
    return $api(`/api/participants/${id}`, {
      method: "DELETE" as never,
    });
  };

  const renderParticipantBadge = async (participant: Participant) => {
    return $api<Blob>(`/api/participants/${participant.id}/badge`);
  };

  const renderParticipantsBadges = async () => {
    return $api<Blob>(`/api/participants/badges`);
  };

  return {
    createParticipant,
    updateParticipant,
    updateCaution,
    removeParticipant,
    renderParticipantBadge,
    renderParticipantsBadges,
  };
};
