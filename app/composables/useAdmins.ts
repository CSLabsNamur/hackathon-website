import type { InviteAdminSchema } from "#shared/schemas/admins/invite";
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
      retry: 0,
      silent,
    });
  };

  return {
    inviteAdmin,
    updateAdminRoles,
    renderAdminBadge,
    renderAdminsBadges,
    removeAdmin,
  };
};
