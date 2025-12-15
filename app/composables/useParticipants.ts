import type { ParticipantCreateWithoutUserInput } from "~~/server/prisma/generated/prisma/models/Participant";
import type { CautionStatus } from "~~/server/prisma/generated/prisma/enums";
import type { EditParticipantSchema } from "#shared/schemas/participants/edit";

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
  const createParticipant = async (data: Omit<ParticipantCreateWithoutUserInput, "curriculumVitae">, cv?: File) => {
    await $fetch("/api/participants", {
      method: "POST",
      body: data,
    });

    // TODO: Re-enable CV upload when backend supports it
    //if (cv) {
    //  const formData = new FormData();
    //  formData.append("file", cv);
    //  await $fetch("/api/participants/curriculum-vitae", {
    //    method: "POST",
    //    body: formData,
    //  });
    //}
  };

  const updateParticipant = async (id: string, data: EditParticipantSchema, cv?: File) => {
    await $fetch(`/api/participants/${id}`, {
      method: "PUT",
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
      //@ts-expect-error wtf
      method: "DELETE",
    });
  };

  return {createParticipant, updateParticipant, updateCaution, removeParticipant};
};
