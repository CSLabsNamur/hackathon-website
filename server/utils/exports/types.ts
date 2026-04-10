import type { Permission } from "#shared/utils/authorization";
import type { AdminExportFormat, AdminExportResource } from "#shared/utils/adminExports";
import type { PrismaRecord } from "../prismaRecordPaths";

export type ExportCellValue = string | number | boolean | Date | null | undefined;

interface ServerAdminExportColumnBase {
  id: string;
  name: string;
  enabledByDefault?: boolean;
  requiredPermissions?: readonly Permission[];
}

export interface ServerAdminExportPathColumn extends ServerAdminExportColumnBase {
  /**
   * Dot-separated Prisma path used for direct export columns.
   * This path is selected in Prisma and its value is exported automatically as-is.
   */
  path: string;
  selectPaths?: never;
  value?: never;
}

export interface ServerAdminExportComputedColumn<Row extends PrismaRecord = PrismaRecord> extends ServerAdminExportColumnBase {
  /**
   * Dot-separated Prisma paths required to compute the exported value.
   * These paths are selected in Prisma and exposed on `row`, to be used in `value`.
   */
  selectPaths: readonly string[];
  /**
   * Computes the exported cell value from the loaded row.
   * Use this together with `selectPaths` for formatted or aggregate columns.
   */
  value: (row: Row) => ExportCellValue;
  path?: never;
}

export type ServerAdminExportColumn<Row extends PrismaRecord = PrismaRecord> =
  | ServerAdminExportPathColumn
  | ServerAdminExportComputedColumn<Row>;

export type PrismaDelegateKey =
  | "participant"
  | "team"
  | "guest"
  | "sponsor"
  | "submissionRequest"
  | "room";

export interface ServerAdminExportSchema<Row extends PrismaRecord = PrismaRecord> {
  resource: AdminExportResource;
  name: string;
  fileBaseName: string;
  sheetName?: string;
  requiredPermissions: readonly Permission[];
  columns: readonly ServerAdminExportColumn<Row>[];
  prismaDelegateKey?: PrismaDelegateKey;
  orderBy?: Record<string, "asc" | "desc">;
  extraSelectPaths?: readonly string[];
  loadRows?: (options: {
    columns: readonly ServerAdminExportColumn<Row>[];
    allowedPermissionKeys: readonly Permission[];
  }) => Promise<Row[]>;
}

export interface AdminExportMatrix {
  name: string;
  sheetName: string;
  columns: Array<{ id: string; name: string }>;
  rows: ExportCellValue[][];
}

export interface AdminExportGeneratedFile {
  contentType: string;
  filename: string;
  data: Buffer;
}

export interface AdminExportGenerator {
  contentType: string;
  extension: AdminExportFormat;
  generate: (matrix: AdminExportMatrix) => Promise<Buffer>;
}
