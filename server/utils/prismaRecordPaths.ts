export type PrismaRecordValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined
  | PrismaRecord
  | PrismaRecordValue[];

export interface PrismaRecord {
  [key: string]: PrismaRecordValue;
}

export type PrismaSelectTree = Record<string, true | { select: PrismaSelectTree }>;

export const stringifyPrismaRecordValue = (value: PrismaRecordValue): string | undefined => {
  if (value === null || value === undefined) return undefined;

  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    return value.map((item) => stringifyPrismaRecordValue(item)).filter(Boolean).join(" ");
  }

  return JSON.stringify(value);
};

export const readPrismaRecordPath = (record: PrismaRecord, path: string): PrismaRecordValue[] => {
  let values: PrismaRecordValue[] = [record];

  for (const segment of path.split(".")) {
    if (!segment) return [];

    values = values
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .flatMap((value) => {
        if (Array.isArray(value) || value === null || value === undefined || typeof value !== "object" || value instanceof Date) {
          return [];
        }

        return [value[segment]];
      });
  }

  return values.flatMap((value) => Array.isArray(value) ? value : [value]);
};

export const readPrismaRecordPathValues = (record: PrismaRecord, path: string): string[] => {
  return [...new Set(readPrismaRecordPath(record, path)
    .map(stringifyPrismaRecordValue)
    .filter((value): value is string => Boolean(value)))];
};

export const buildPrismaSelect = (paths: Iterable<string>): PrismaSelectTree => {
  const select: PrismaSelectTree = {};

  for (const path of paths) {
    if (!path) continue;

    const segments = path.split(".");
    let cursor = select;

    for (const [index, segment] of segments.entries()) {
      if (!segment) {
        break;
      }

      if (index === segments.length - 1) {
        cursor[segment] = true;
        continue;
      }

      if (!cursor[segment] || cursor[segment] === true) {
        cursor[segment] = {select: {}};
      }

      cursor = (cursor[segment] as { select: PrismaSelectTree }).select;
    }
  }

  return select;
};
