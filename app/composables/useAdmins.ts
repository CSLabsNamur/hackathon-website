import type { InviteAdminSchema } from "#shared/schemas/admins/invite";

interface UseAdminsParams {
  lazy?: boolean;
}

export const useAdmins = async (params?: UseAdminsParams) => {
  return useFetch("/api/admins", {
    lazy: params?.lazy ?? false,
    //cache: "force-cache",
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

  return {
    inviteAdmin,
  };
};
