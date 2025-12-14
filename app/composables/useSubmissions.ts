import { type CreateSubmissionRequestSchema } from "#shared/schemas/submissions/requests/create";
import type { EditSubmissionRequestSchema } from "#shared/schemas/submissions/requests/edit";

interface UseSubmissionsParams {
  lazy?: boolean;
}

export const useSubmissionsRequests = async (params?: UseSubmissionsParams) => {
  return useFetch("/api/submissions/requests", {
    lazy: params?.lazy ?? false,
    //cache: "force-cache",
  });
};

export const useSubmissionsRequestsActions = () => {
  const createSubmissionRequest = async (data: CreateSubmissionRequestSchema) => {
    return await $fetch("/api/submissions/requests", {
      method: "POST",
      body: data,
    });
  };

  const editSubmissionRequest = async (id: string, data: EditSubmissionRequestSchema) => {
    return await $fetch(`/api/submissions/requests/${id}`, {
      method: "PUT",
      body: data,
    });
  };

  const removeSubmissionRequest = async (id: string) => {
    return await $fetch(`/api/submissions/requests/${id}`, {
      method: "DELETE",
    });
  };

  return {
    createSubmissionRequest,
    editSubmissionRequest,
    removeSubmissionRequest,
  };
};

export const useSubmissions = async (params?: UseSubmissionsParams) => {
  return useFetch("/api/submissions/me", {
    lazy: params?.lazy ?? false,
    //cache: "force-cache",
  });
};

export const useSubmissionsActions = () => {
  const submit = async (requestId: string, content?: string, skipped?: boolean) => {
    return $fetch(`/api/submissions/requests/${requestId}/submit`, {
      method: "POST",
      body: {
        content,
        skipped,
      },
    });
  };

  return {
    submit,
  };
};