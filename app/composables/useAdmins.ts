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
  const {$api} = useNuxtApp();

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

  return {
    inviteAdmin,
    updateAdminRoles,
    renderAdminBadge,
  };
};
