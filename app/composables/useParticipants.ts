import type { ParticipantCreateInput } from "~~/server/prisma/generated/prisma/models/Participant";
import type { CautionStatus } from "~~/server/prisma/generated/prisma/enums";

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
  const createParticipant = async (data: ParticipantCreateInput) => {
    return $fetch("/api/participants", {
      method: "POST",
      body: data,
    });
  };

  const updateCaution = async (id: string, caution: CautionStatus) => {
    return $fetch(`/api/participants/${id}/caution`, {
      method: "PATCH",
      body: {caution},
    });
  };

  const removeParticipant = async (id: string) => {
    return $fetch(`/api/participants/${id}`, {
      method: "DELETE",
    });
  };

  return {createParticipant, updateCaution, removeParticipant};
};
