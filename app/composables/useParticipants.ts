import type { CautionStatus } from "~~/server/prisma/generated/prisma/enums";
import type { EditParticipantSchema } from "#shared/schemas/participants/edit";
import type { CreateParticipantSchema } from "#shared/schemas/participants/create";

interface UseParticipantsParams {
  lazy?: boolean;
  immediate?: boolean;
}

export const useParticipants = async (params?: UseParticipantsParams) => {
  return useAPI<AdminParticipant[]>("/api/participants", {
    key: "participants",
    dedupe: "defer",
    lazy: params?.lazy ?? false,
    immediate: params?.immediate ?? true,
  });
};

export const useParticipantsActions = () => {
  const {$api} = useNuxtApp();

  const createParticipant = async (data: CreateParticipantSchema) => {
    return $api("/api/participants", {
      method: "POST",
      body: data,
    });
  };

  const updateParticipant = async (id: string, data: EditParticipantSchema) => {
    return $api(`/api/participants/${id}`, {
      //@ts-expect-error wtf
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

  const removeParticipant = async (id: string, silent = false) => {
    return $api(`/api/participants/${id}`, {
      method: "DELETE" as never,
      silent,
    });
  };

  const renderParticipantBadge = async (participant: Pick<AdminParticipant, "id">) => {
    return $api<Blob>(`/api/participants/${participant.id}/badge`);
  };

  const renderParticipantsBadges = async (ids?: string[]) => {
    if (ids) return $api<Blob>("/api/participants/badges", {method: "POST", body: {ids}});
    return $api<Blob>("/api/participants/badges");
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
