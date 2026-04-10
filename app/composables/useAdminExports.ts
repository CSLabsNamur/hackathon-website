import type { AdminExportBody } from "#shared/schemas/admin/export";

export const useAdminExportsActions = () => {
  const {$api} = useNuxtApp();

  const getExportSchema = async (resource: AdminExportResource) => {
    return $api<AdminExportSchemaDefinition>(`/api/admin/exports/${resource}`);
  };

  const exportResource = async (resource: AdminExportResource, body: AdminExportBody) => {
    let filename: string | undefined;

    const response = await $api<Blob>(`/api/admin/exports/${resource}`, {
      method: "POST",
      body,
      responseType: "blob",
      onResponse({response}) {
        filename = response.headers.get("content-disposition")?.match(/filename="?([^"]+)"?/i)?.[1];
      },
    });

    return {
      blob: response,
      filename: filename ?? `export.${body.format}`,
    };
  };

  return {
    getExportSchema,
    exportResource,
  };
};
