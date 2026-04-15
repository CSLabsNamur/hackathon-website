import type { UpdateSettingsSchema } from "#shared/schemas/settings/update";

interface UseSettingsParams {
  lazy?: boolean;
}

export const useSettings = async (params?: UseSettingsParams) => {
  return useAPI("/api/settings", {
    key: "settings",
    dedupe: "defer",
    lazy: params?.lazy ?? false,
  });
};

export const useAdminSettings = async (params?: UseSettingsParams) => {
  return useAPI("/api/admin/settings", {
    key: "admin-settings",
    dedupe: "defer",
    lazy: params?.lazy ?? false,
  });
};

export const useSettingsActions = () => {
  const {$api} = useNuxtApp();

  const updateSettings = async (data: UpdateSettingsSchema, logoFile?: File) => {
    const formData = new FormData();
    formData.append("settings", JSON.stringify(data));
    if (logoFile) {
      formData.append("logoFile", logoFile);
    }

    return $api("/api/admin/settings", {
      method: "PUT",
      body: formData,
    });
  };

  return {
    updateSettings,
  };
};
