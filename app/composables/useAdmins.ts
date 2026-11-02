import type { InviteAdminSchema } from "#shared/schemas/admins/invite";
import type { EditAdminSchema } from "#shared/schemas/admins/edit";
import type { UpdateAdminRolesSchema } from "#shared/schemas/admins/updateRoles";

interface UseAdminsParams {
  lazy?: boolean;
}

export const useAdmins = async (params?: UseAdminsParams) => {
  return useAPI("/api/admins", {
    key: "admins",
    dedupe: "defer",
    lazy: params?.lazy ?? false,
  });
};

export const useAdminsActions = () => {
  const nuxtApp = useNuxtApp();
  const {$api} = nuxtApp;

  const inviteAdmin = async (data: InviteAdminSchema) => {
    return $api("/api/admins", {
      method: "POST",
      body: data,
    });
  };

  const updateAdmin = async (id: string, data: EditAdminSchema) => {
    return $api(`/api/admins/${id}`, {
      method: "PUT",
      body: data,
    });
  };

  const updateAdminRoles = async (id: string, data: UpdateAdminRolesSchema) => {
    return $api(`/api/admins/${id}/roles`, {
      method: "PUT",
      body: data,
    });
  };

  const renderAdminBadge = async (admin: Admin) => {
    return $api<Blob>(`/api/admins/${admin.id}/badge`);
  };

  const renderAdminsBadges = async (ids: string[]) => {
    return $api<Blob>("/api/admins/badges", {method: "POST", body: {ids}});
  };

  const removeAdmin = async (id: string, silent = false) => {
    return $api(`/api/admins/${id}`, {
      method: "DELETE",
      silent,
    });
  };

  return {
    inviteAdmin,
    updateAdmin,
    updateAdminRoles,
    renderAdminBadge,
    renderAdminsBadges,
    removeAdmin,
  };
};
