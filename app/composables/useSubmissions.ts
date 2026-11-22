import type { CreateSubmissionRequestSchema } from "#shared/schemas/submissions/requests/create";
import type { EditSubmissionRequestSchema } from "#shared/schemas/submissions/requests/edit";
import type { SubmitTextSchema } from "#shared/schemas/submissions/submitText";
import type { UploadSchema } from "#shared/schemas/submissions/upload";
import type { CurrentParticipantSubmission } from "#shared/utils/types";

interface UseSubmissionsParams {
  lazy?: boolean;
}

export const useSubmissionsRequests = async (params?: UseSubmissionsParams) => {
  return useAPI("/api/submissions/requests", {
    key: "submissions-requests",
    dedupe: "defer",
    lazy: params?.lazy ?? false,
  });
};

export const useAdminSubmissionRequests = async (params?: UseSubmissionsParams) => {
  return useAPI("/api/admin/submission-requests", {
    key: "admin-submission-requests",
    dedupe: "defer",
    lazy: params?.lazy ?? false,
  });
};

export const useSubmissionsRequestsActions = () => {
  const {$api} = useNuxtApp();

  const createSubmissionRequest = async (data: CreateSubmissionRequestSchema) => {
    return await $api("/api/submissions/requests", {
      method: "POST",
      body: data,
      silent: true,
    });
  };

  const editSubmissionRequest = async (id: string, data: EditSubmissionRequestSchema) => {
    return await $api(`/api/submissions/requests/${id}`, {
      method: "PUT",
      body: data,
      silent: true,
    });
  };

  const removeSubmissionRequest = async (id: string, silent = false) => {
    return await $api(`/api/submissions/requests/${id}`, {
      method: "DELETE",
      silent,
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
    key: "submissions",
    dedupe: "defer",
    lazy: params?.lazy ?? false,
  });
};

export const useSubmissionsActions = () => {
  const {$api} = useNuxtApp();

  const submitText = async (requestId: string, data: SubmitTextSchema) => {
    return $api<CurrentParticipantSubmission>(`/api/submissions/requests/${requestId}/submit`, {
      method: "POST",
      body: data,
      silent: true,
    });
  };

  const uploadFiles = async (requestId: string, data: UploadSchema) => {
    const form = new FormData();
    form.set("skipped", data.skipped ? "true" : "false");
    if (data.expectedUpdatedAt !== undefined) form.set("expectedUpdatedAt", data.expectedUpdatedAt ?? "null");
    if (data.expectedTeamId !== undefined) form.set("expectedTeamId", data.expectedTeamId ?? "null");

    if (data.files) {
      for (const f of data.files) {
        form.append("files", f);
      }
    }

    return $api<CurrentParticipantSubmission>(`/api/submissions/requests/${requestId}/upload`, {
      method: "POST",
      body: form,
      silent: true,
    });
  };

  const deleteSubmissionFile = async (requestId: string, fileId: string) => {
    return $api<CurrentParticipantSubmission | null>(`/api/submissions/requests/${requestId}/files/${fileId}`, {
      method: "DELETE",
      silent: true,
    });
  };

  const downloadSubmissionFile = (requestId: string, fileId: string) =>
    $api<Blob>(`/api/submissions/requests/${requestId}/files/${fileId}`, {responseType: "blob", silent: true});

  return {
    submitText,
    uploadFiles,
    deleteSubmissionFile,
    downloadSubmissionFile,
  };
};
