import type { CreateRoleSchema } from "#shared/schemas/roles/create";
import type { EditRoleSchema } from "#shared/schemas/roles/edit";

interface UseRolesParams {
  lazy?: boolean;
}

export const useRoles = async (params?: UseRolesParams) => {
  return useAPI("/api/roles", {
    lazy: params?.lazy ?? false,
  });
};

export const usePermissions = async () => {
  return useAPI("/api/permissions");
};

export const useRolesActions = () => {
  const {$api} = useNuxtApp();

  const createRole = async (data: CreateRoleSchema) => {
    return $api("/api/roles", {
      method: "POST",
      body: data,
    });
  };

  const updateRole = async (id: string, data: EditRoleSchema) => {
    return $api(`/api/roles/${id}`, {
      method: "PUT",
      body: data,
    });
  };

  const removeRole = async (id: string) => {
    return $api(`/api/roles/${id}`, {
      method: "DELETE" as never,
    });
  };

  return {
    createRole,
    updateRole,
    removeRole,
  };
};
