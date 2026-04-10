// TODO: Refactor this into multiple files for better maintainability
import ExcelJS from "exceljs";
import prisma from "../prisma";

type ExportDelegate<Row extends PrismaRecord> = {
  findMany: (args: {
    select: PrismaSelectTree;
    orderBy?: Record<string, "asc" | "desc">;
  }) => Promise<Row[]>;
};

type AdminExportSchema = AdminExportSchemaMap[keyof AdminExportSchemaMap];
type ExportSchemaRow<Schema extends AdminExportSchema> = Schema extends ServerAdminExportSchema<infer Row> ? Row : never;
type ExportSchemaColumn<Schema extends AdminExportSchema> = ServerAdminExportColumn<ExportSchemaRow<Schema>>;

const hasRequiredPermissions = (requiredPermissions: readonly Permission[] | undefined, allowedPermissionKeys: ReadonlySet<Permission>) => {
  return !requiredPermissions?.length || requiredPermissions.every((permission) => allowedPermissionKeys.has(permission));
};

const getAvailableSchema = <Resource extends AdminExportResource>(resource: Resource, allowedPermissionKeys: readonly Permission[]): AdminExportSchemaMap[Resource] => {
  const schema = ADMIN_EXPORT_SCHEMAS[resource];

  const allowedPermissionSet = new Set(allowedPermissionKeys);
  if (!hasRequiredPermissions(schema.requiredPermissions, allowedPermissionSet)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Vous n'avez pas les permissions nécessaires pour exporter cette ressource.",
    });
  }

  return schema;
};

const getAvailableColumns = <Schema extends AdminExportSchema>(schema: Schema, allowedPermissionKeys: readonly Permission[]) => {
  const allowedPermissionSet = new Set(allowedPermissionKeys);
  return schema.columns.filter((column) => hasRequiredPermissions(column.requiredPermissions, allowedPermissionSet)) as ExportSchemaColumn<Schema>[];
};

const resolveSelectedColumns = <Schema extends AdminExportSchema>(schema: Schema, allowedPermissionKeys: readonly Permission[], selectedColumnIds?: readonly string[]) => {
  const availableColumns = getAvailableColumns(schema, allowedPermissionKeys);
  const requestedColumnIds = selectedColumnIds?.length
    ? [...new Set(selectedColumnIds)]
    : availableColumns.filter(<Schema extends AdminExportSchema>(column: ExportSchemaColumn<Schema>) => {
      return column.enabledByDefault ?? true;
    }).map((column) => column.id);
  const effectiveColumnIds = requestedColumnIds.length ? requestedColumnIds : availableColumns.map((column) => column.id);
  const effectiveColumnIdSet = new Set(effectiveColumnIds);
  const selectedColumns = availableColumns.filter((column) => effectiveColumnIdSet.has(column.id));

  if (selectedColumns.length !== effectiveColumnIdSet.size) {
    throw createError({statusCode: 400, statusMessage: "Une ou plusieurs colonnes sélectionnées sont invalides."});
  }

  if (selectedColumns.length === 0) {
    throw createError({statusCode: 400, statusMessage: "Veuillez sélectionner au moins une colonne à exporter."});
  }

  return selectedColumns;
};

const loadSchemaRows = async <Schema extends AdminExportSchema>(schema: Schema, columns: readonly ExportSchemaColumn<Schema>[], allowedPermissionKeys: readonly Permission[]): Promise<ExportSchemaRow<Schema>[]> => {
  const loadRows = schema.loadRows as ((options: {
    columns: readonly ExportSchemaColumn<Schema>[];
    allowedPermissionKeys: readonly Permission[];
  }) => Promise<ExportSchemaRow<Schema>[]>) | undefined;

  if (loadRows) {
    return loadRows({columns, allowedPermissionKeys});
  }

  if (!schema.prismaDelegateKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Cette ressource n'est pas correctement configurée pour l'export. Veuillez contacter le mainteneur actuel du site.",
    });
  }

  const delegate = Reflect.get(prisma, schema.prismaDelegateKey) as unknown as ExportDelegate<ExportSchemaRow<Schema>> | undefined;

  if (!delegate?.findMany) {
    throw createError({statusCode: 500, statusMessage: "La clef Prisma pour cette ressource est invalide."});
  }

  const selectPaths = new Set<string>([
    "id",
    ...(schema.extraSelectPaths ?? []),
    ...columns.flatMap((column) => ([
      ...(column.path ? [column.path] : []),
      ...(column.selectPaths ?? []),
    ])),
  ]);

  return delegate.findMany({
    select: buildPrismaSelect(selectPaths),
    orderBy: schema.orderBy,
  });
};

const normalizeExportCellValue = (value: unknown): ExportCellValue => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value instanceof Date) {
    return value;
  }

  return stringifyPrismaRecordValue(value as PrismaRecordValue);
};

const getColumnValue = <Schema extends AdminExportSchema>(row: ExportSchemaRow<Schema>, column: ExportSchemaColumn<Schema>): ExportCellValue => {
  if (column.value) {
    return normalizeExportCellValue(column.value(row));
  }

  if (!column.path) return undefined;

  const values = readPrismaRecordPath(row, column.path)
    .map((value) => normalizeExportCellValue(value))
    .filter((value) => value !== undefined);

  if (values.length === 0) return undefined;

  return values.length === 1
    ? values[0]
    : values
      .map((value) => stringifyExportCellValue(value))
      .filter(Boolean)
      .join(", ");
};

const buildMatrix = <Schema extends AdminExportSchema>(schema: Schema, rows: readonly ExportSchemaRow<Schema>[], columns: readonly ExportSchemaColumn<Schema>[]): AdminExportMatrix => {
  return {
    name: schema.name,
    sheetName: sanitizeWorksheetName(schema.sheetName ?? schema.name),
    columns: columns.map((column) => ({id: column.id, name: column.name})),
    rows: rows.map((row) => columns.map((column) => getColumnValue(row, column))),
  };
};

const stringifyExportCellValue = (value: ExportCellValue) => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
};

const escapeCsvCell = (value: ExportCellValue) => {
  const normalized = stringifyExportCellValue(value);

  if (/[",\r\n]/.test(normalized)) {
    return `"${normalized.replaceAll("\"", "\"\"")}"`;
  }

  return normalized;
};

const CSV_GENERATOR: AdminExportGenerator = {
  contentType: "text/csv; charset=utf-8",
  extension: "csv",
  async generate(matrix) {
    const lines = [
      matrix.columns.map((column) => escapeCsvCell(column.name)).join(","),
      ...matrix.rows.map((row) => row.map((value) => escapeCsvCell(value)).join(",")),
    ];

    return Buffer.from(`\uFEFF${lines.join("\r\n")}`, "utf-8");
  },
};

const XLSX_GENERATOR: AdminExportGenerator = {
  contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  extension: "xlsx",
  async generate(matrix) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(matrix.sheetName);

    worksheet.addRow(matrix.columns.map((column) => column.name));
    for (const row of matrix.rows) {
      worksheet.addRow(row.map((value) => value ?? ""));
    }

    const headerRow = worksheet.getRow(1);
    headerRow.font = {bold: true};
    headerRow.commit();
    worksheet.views = [{state: "frozen", ySplit: 1}];
    worksheet.columns = matrix.columns.map((column, index) => ({
      key: column.id,
      width: Math.min(48, Math.max(
        column.name.length + 2,
        ...matrix.rows.map((row) => stringifyExportCellValue(row[index]).length + 2),
      )),
    }));

    return Buffer.from(await workbook.xlsx.writeBuffer() as ArrayBuffer);
  },
};

const EXPORT_GENERATORS: Record<AdminExportFormat, AdminExportGenerator> = {
  csv: CSV_GENERATOR,
  xlsx: XLSX_GENERATOR,
};

const sanitizeWorksheetName = (name: string) => {
  const sanitized = name.replace(/[\\/*?:[\]]/g, " ").replace(/\s+/g, " ").trim();
  return sanitized.slice(0, 31) || "Export";
};

const buildFilename = <Schema extends AdminExportSchema>(schema: Schema, format: AdminExportFormat) => {
  const timestamp = new Date().toISOString().replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z").replace("T", "_");
  return sanitizeFilename(`${schema.fileBaseName}_${timestamp}.${format}`);
};

export const getAdminExportSchemaDefinition = <Resource extends AdminExportResource>(resource: Resource, allowedPermissionKeys: readonly Permission[]): AdminExportSchemaDefinition => {
  const schema = getAvailableSchema(resource, allowedPermissionKeys);
  const columns = getAvailableColumns(schema, allowedPermissionKeys);

  return {
    resource: schema.resource,
    name: schema.name,
    formats: ADMIN_EXPORT_FORMATS,
    columns: columns.map((column) => ({
      id: column.id,
      name: column.name,
      enabledByDefault: column.enabledByDefault ?? true,
    })),
  };
};

export const generateAdminExportFile = async <Resource extends AdminExportResource>(resource: Resource, format: AdminExportFormat, selectedColumnIds: readonly string[] | undefined, allowedPermissionKeys: readonly Permission[]): Promise<AdminExportGeneratedFile> => {
  const schema = getAvailableSchema(resource, allowedPermissionKeys);
  const columns = resolveSelectedColumns(schema, allowedPermissionKeys, selectedColumnIds);
  const rows = await loadSchemaRows(schema, columns, allowedPermissionKeys);
  const matrix = buildMatrix(schema, rows, columns);
  const generator = EXPORT_GENERATORS[format];

  if (!generator) {
    throw createError({statusCode: 400, statusMessage: "Format d'export invalide."});
  }

  return {
    contentType: generator.contentType,
    filename: buildFilename(schema, generator.extension),
    data: await generator.generate(matrix),
  };
};
