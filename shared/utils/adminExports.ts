export const ADMIN_EXPORT_RESOURCES = [
  "participants",
  "teams",
  "guests",
  "sponsors",
  "submissionRequests",
  "rooms",
] as const;

export type AdminExportResource = typeof ADMIN_EXPORT_RESOURCES[number];

export const ADMIN_EXPORT_FORMATS = ["csv", "xlsx"] as const;
export type AdminExportFormat = typeof ADMIN_EXPORT_FORMATS[number];

export const ADMIN_EXPORT_FORMAT_LABELS: Record<AdminExportFormat, string> = {
  csv: "CSV (.csv)",
  xlsx: "Excel (.xlsx)",
};

export interface AdminExportColumnDefinition {
  id: string;
  name: string;
  enabledByDefault: boolean;
}

export interface AdminExportSchemaDefinition {
  resource: AdminExportResource;
  name: string;
  formats: readonly AdminExportFormat[];
  columns: readonly AdminExportColumnDefinition[];
}
