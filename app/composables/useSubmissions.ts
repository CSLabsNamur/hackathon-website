import { type CreateSubmissionRequestSchema } from "#shared/schemas/submissions/requests/create";
import type { EditSubmissionRequestSchema } from "#shared/schemas/submissions/requests/edit";

interface UseSubmissionsParams {
  lazy?: boolean;
}

export const useSubmissionsRequests = async (params?: UseSubmissionsParams) => {
  return useAPI("/api/submissions/requests", {
    lazy: params?.lazy ?? false,
    //cache: "force-cache",
  });
};

export const useSubmissionsRequestsActions = () => {
  const { $api } = useNuxtApp()

  const createSubmissionRequest = async (data: CreateSubmissionRequestSchema) => {
    return await $api("/api/submissions/requests", {
      method: "POST",
      body: data,
    });
  };

  const editSubmissionRequest = async (id: string, data: EditSubmissionRequestSchema) => {
    return await $api(`/api/submissions/requests/${id}`, {
      method: "PUT",
      body: data,
    });
  };

  const removeSubmissionRequest = async (id: string) => {
    return await $api(`/api/submissions/requests/${id}`, {
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
  return useAPI("/api/submissions/me", {
    lazy: params?.lazy ?? false,
    //cache: "force-cache",
  });
};

export const useSubmissionsActions = () => {
  const { $api } = useNuxtApp()

  const submit = async (requestId: string, content?: string, skipped?: boolean) => {
    return $api(`/api/submissions/requests/${requestId}/submit`, {
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