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
    for (const item in data) {
      formData.append(item, data[item as keyof CreateParticipantSchema] as string | File);
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
      //@ts-expect-error wtf
      method: "DELETE",
    });
  };

  return {createParticipant, updateParticipant, updateCaution, removeParticipant};
};
