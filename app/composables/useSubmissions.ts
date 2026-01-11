import type { CreateSubmissionRequestSchema } from "#shared/schemas/submissions/requests/create";
import type { EditSubmissionRequestSchema } from "#shared/schemas/submissions/requests/edit";
import type { SubmitTextSchema } from "#shared/schemas/submissions/submitText";
import type { UploadSchema } from "#shared/schemas/submissions/upload";

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
  const {$api} = useNuxtApp();

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
  return useFetch("/api/submissions/me", {
    lazy: params?.lazy ?? false,
    //cache: "force-cache",
  });
};

export const useSubmissionsActions = () => {
  const {$api} = useNuxtApp();

  const submitText = async (requestId: string, data: SubmitTextSchema) => {
    return $api(`/api/submissions/requests/${requestId}/submit`, {
      body: data,
    });
  };

  const uploadFiles = async (requestId: string, data: UploadSchema) => {
    const form = new FormData();
    form.set("skipped", data.skipped ? "true" : "false");

    if (data.files) {
      for (const f of data.files) {
        form.append("files", f);
      }
    }

    return $api(`/api/submissions/requests/${requestId}/upload`, {
      method: "POST",
      body: form,
    });
  };

  const deleteSubmissionFile = async (requestId: string, fileId: string) => {
    return $api(`/api/submissions/requests/${requestId}/files/${fileId}`, {
      method: "DELETE",
    });
  };

  return {
    submitText,
    uploadFiles,
    deleteSubmissionFile,
  };
};