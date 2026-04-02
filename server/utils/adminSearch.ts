/**
 * This file is 60% AI generated.
 * The logic made by AI was heavily refactored and simplified by hand.
 */
import Fuse, { type FuseOptionKey } from "fuse.js";
import { ADMIN_SEARCH_MIN_QUERY_LENGTH, type AdminSearchGroup, type AdminSearchItem } from "#shared/utils/adminSearch";
import {
  ADMIN_SEARCH_MODEL_CONFIGS,
  type AdminSearchModelConfig,
  type AdminSearchModelName,
  type AdminSearchPathConfig,
  type SearchRecord,
  type SearchValue,
} from "./adminSearch.config";
import prisma from "./prisma";

type SearchWhere = Record<string, unknown>;
type SearchSelectTree = Record<string, true | { select: SearchSelectTree }>;
type SearchFieldDefinition = AdminSearchPathConfig & { weight: number };

/**
 * Runtime-ready version of one model config, with precomputed select and Fuse metadata.
 */
interface SearchModelDefinition {
  modelName: AdminSearchModelName;
  groupLabel: string;
  icon: string;
  route: string;
  /** Whether default result links should append `?search=<searchTerm>` */
  useSearchParam: boolean;
  /** True when `searchTerm` should be included as a dedicated Fuse key instead of only as display title text */
  rankWithSearchTerm: boolean;
  titlePaths: readonly string[];
  descriptionPaths: readonly string[];
  /** Path used to extract the navigation/search handoff value from each Prisma record */
  searchTermPath: string;
  buildTitle?: (record: SearchRecord) => string | undefined;
  buildDescription?: (record: SearchRecord) => string | undefined;
  buildTo?: (record: SearchRecord) => string;
  /** Searchable fields with normalized default weights */
  searchFields: SearchFieldDefinition[];
  /** Prisma select tree built from every path this model needs at runtime */
  select: SearchSelectTree;
  /** Weighted Fuse keys */
  fuseKeys: FuseOptionKey<SearchCandidate>[];
  /** Single Prisma orderBy object used for the prefetch before Fuse ranking */
  orderBy: Record<string, "asc" | "desc">;
}

/**
 * Parsed query tokens reused across all model field filters, separated into strings and numbers for correct Prisma operator usage.
 */
interface SearchQueryInput {
  strings: string[];
  numbers: number[];
}

/**
 * Object searched by Fuse after Prisma returns candidate records.
 */
interface SearchCandidate {
  item: AdminSearchItem;
  title: string;
  /** Optional canonical value boosted separately in Fuse, usually an email or similar identifier. */
  searchTerm?: string;
  description?: string;
  /** Flattened field values keyed as `f0`, `f1`, ... to align with generated Fuse keys. */
  fields: Record<string, string>;
}

/**
 * Minimal Prisma delegate, used to type the dynamic model delegates we access by reflection.
 */
interface SearchDelegate {
  findMany: (args: {
    where: { OR: SearchWhere[] };
    select: SearchSelectTree;
    take: number;
    orderBy: Record<string, "asc" | "desc">;
  }) => Promise<SearchRecord[]>;
}

const DESCRIPTION_MAX_LENGTH = 96;
const FETCH_LIMIT_FLOOR = 12;
const FETCH_LIMIT_MULTIPLIER = 3;
const FUSE_THRESHOLD = 0.35;
const MIN_ITEMS_PER_GROUP = 3;

let cachedDefinitions: SearchModelDefinition[] | null = null;

const truncate = (value: string, maxLength = DESCRIPTION_MAX_LENGTH) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
};

/**
 * Stringifies a search value for indexing and comparison.
 * Handles strings, numbers, booleans, dates, arrays, and objects.
 *
 * @param value The value to stringify.
 * @returns A trimmed string representation of the value, or undefined if the value is null or undefined.
 */
const stringifyValue = (value: SearchValue): string | undefined => {
  if (value === null || value === undefined) return undefined;

  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    return value.map((item) => stringifyValue(item)).filter(Boolean).join(" ");
  }

  return JSON.stringify(value);
};

/**
 * Reads values from a Prisma record based on a dot-separated path.
 * Since a path might point to multiple values, this function returns an array.
 *
 * @param record The Prisma record to read from
 * @param path The dot-separated path to read (e.g., "author.name" or "comments.text")
 * @returns An array of string values found at the specified path, or an empty array if no values are found
 */
const readPathValues = (record: SearchRecord, path: string): string[] => {
  let values: SearchValue[] = [record];

  for (const segment of path.split(".")) {
    if (!segment) return [];

    // Traversal step
    values = values
      // Flatten arrays at each step to handle "many" relations, and filter out null/undefined values
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .flatMap((value) => {
        // If the current value is not an object (or is null/undefined), we can't read further, so return an empty array to exclude this path.
        if (Array.isArray(value) || value === null || value === undefined || typeof value !== "object" || value instanceof Date) {
          return [];
        }

        return [value[segment]];
      });
  }

  // If the final values are arrays, flatten them and stringify all values.
  return [...new Set(values
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .map(stringifyValue)
    .filter((value): value is string => Boolean(value)))];
};

/**
 * Builds a Prisma select tree from a set of dot-separated paths.
 *
 * For example, given paths ["author.name", "author.email", "comments.text"], it will build:
 * ```{
 *  select: {
 *    author: {
 *      select: {
 *        name: true,
 *        email: true,
 *      }
 *    },
 *    comments: {
 *      select: {
 *        text: true,
 *      }
 *    }
 *  }
 * }
 * ```
 *
 * @param paths An iterable of dot-separated paths to include in the select tree.
 * @returns A Prisma select tree object that can be used in a findMany query to select the specified paths.
 */
const buildSelect = (paths: Iterable<string>): SearchSelectTree => {
  const select: SearchSelectTree = {id: true};

  for (const path of paths) {
    const segments = path.split(".");
    let cursor = select;

    for (const [index, segment] of segments.entries()) {
      if (index === segments.length - 1) {
        cursor[segment] = true;
        continue;
      }

      if (!cursor[segment] || cursor[segment] === true) {
        cursor[segment] = {select: {}};
      }

      cursor = (cursor[segment] as { select: SearchSelectTree }).select;
    }
  }

  return select;
};

/**
 * Builds the search query input by extracting unique strings and numbers from the raw query.
 * This allows us to construct correct Prisma where clauses for both text and numeric fields.
 *
 * @param query The raw search query input by the user
 * @returns An object containing arrays of strings and numbers extracted from the query, or null if the query is empty after trimming
 */
const buildQueryInput = (query: string): SearchQueryInput | null => {
  const trimmed = query.trim();
  if (!trimmed) return null;

  // Extract unique strings and numbers from the query for searching, which is necessary to build the Prisma where clauses correctly.
  const strings = [...new Set([trimmed, ...trimmed.split(/\s+/).filter(Boolean)])];
  const numbers = [...new Set(strings
    .filter((value) => /^-?\d+(\.\d+)?$/.test(value))
    .map(Number)
    .filter((value) => !Number.isNaN(value)))];

  return {strings, numbers};
};

/**
 * Builds Prisma where clauses for a given search field definition and query input.
 *
 * For example, "team.name" with a query of "alpha beta" would produce:
 * ```
 * [
 *   { team: { name: { contains: "alpha", mode: "insensitive" } } },
 *   { team: { name: { contains: "beta", mode: "insensitive" } } }
 * ]
 * ```
 *
 * @param field The search field definition, including the path, type, and matching configuration
 * @param query The structured search query input containing arrays of strings and numbers to search for
 * @returns An array of Prisma where clauses that can be combined with OR to search for the specified query in the given field
 */
const buildWhereClauses = (field: SearchFieldDefinition, query: SearchQueryInput): SearchWhere[] => {
  const segments = field.path.split(".");
  const leafName = segments.at(-1);

  if (!leafName) {
    return [];
  }

  const leafClauses = (() => {
    switch (field.match) {
      case "equals":
        return query.numbers.map((value) => ({[leafName]: {equals: value}}));
      case "has":
        return query.strings.map((value) => ({[leafName]: {has: value}}));
      case "string_contains":
        return query.strings.map((value) => ({[leafName]: {string_contains: value}}));
      case "contains":
      case undefined:
        return query.strings.map((value) => ({[leafName]: {contains: value, mode: "insensitive"}}));
    }
  })();

  return leafClauses.map((leaf) => {
    let condition = leaf as SearchWhere;

    for (let index = segments.length - 2; index >= 0; index--) {
      const segment = segments[index];

      if (!segment) {
        continue;
      }

      const mode = field.relationModes?.[index] ?? "one";
      condition = mode === "many" ? {[segment]: {some: condition}} : {[segment]: {is: condition}};
    }

    return condition;
  });
};

const buildDefinitions = (): SearchModelDefinition[] => {
  return (Object.entries(ADMIN_SEARCH_MODEL_CONFIGS) as Array<[AdminSearchModelName, AdminSearchModelConfig]>)
    .map(([modelName, config]) => {
      const searchFields = config.searchFields.map((field) => ({
        ...field,
        weight: field.weight ?? 1,
      }));
      const searchTermPath = config.searchTermPath ?? config.titlePaths[0] ?? "id";
      const rankWithSearchTerm = Boolean(config.searchTermPath);
      const selectPaths = new Set<string>([
        ...config.titlePaths,
        ...(config.descriptionPaths ?? []),
        searchTermPath,
        ...searchFields.map((field) => field.path),
      ]);
      const rawFuseKeys: Array<{ name: string; weight: number }> = [
        {name: "title", weight: 6},
        ...(rankWithSearchTerm ? [{name: "searchTerm", weight: 5}] : []),
        {name: "description", weight: 2},
        ...searchFields.map((field, index) => ({
          name: `fields.f${index}`,
          weight: field.weight,
        })),
      ];
      const totalFuseWeight = rawFuseKeys.reduce((sum, key) => sum + key.weight, 0);

      return {
        modelName,
        groupLabel: config.groupLabel,
        icon: config.icon,
        route: config.route,
        useSearchParam: config.useSearchParam ?? true,
        rankWithSearchTerm,
        titlePaths: config.titlePaths,
        descriptionPaths: config.descriptionPaths ?? [],
        searchTermPath,
        buildTitle: config.buildTitle,
        buildDescription: config.buildDescription,
        buildTo: config.buildTo,
        searchFields,
        select: buildSelect(selectPaths),
        fuseKeys: rawFuseKeys.map((key) => ({
          ...key,
          weight: key.weight / totalFuseWeight,
        })) satisfies FuseOptionKey<SearchCandidate>[],
        orderBy: {[config.orderBy ?? "updatedAt"]: "desc"},
      };
    });
};

export const searchAdminIndex = async (query: string, limit: number): Promise<AdminSearchGroup[]> => {
  const input = buildQueryInput(query);

  if (!input) return [];

  // Disgusting operator but deal with it
  // Basically: if cachedDefinitions is not null, use it, otherwise build definitions and cache them for next calls
  const definitions = cachedDefinitions ??= buildDefinitions();
  const perGroupLimit = Math.max(MIN_ITEMS_PER_GROUP, Math.ceil(limit / Math.max(definitions.length, 1)));
  const results = await Promise.all(definitions.map(async (definition) => {
    const delegate = Reflect.get(prisma, definition.modelName.charAt(0).toLowerCase() + definition.modelName.slice(1)) as SearchDelegate | undefined;
    const clauses = definition.searchFields.flatMap((field) => buildWhereClauses(field, input));

    if (!delegate?.findMany || clauses.length === 0) {
      return null;
    }

    const records = await delegate.findMany({
      where: {OR: clauses},
      select: definition.select,
      take: Math.max(FETCH_LIMIT_FLOOR, limit * FETCH_LIMIT_MULTIPLIER),
      orderBy: definition.orderBy,
    });

    const candidates = records
      .map<SearchCandidate | null>((record) => {
        const title = truncate(
          definition.buildTitle?.(record)
          || definition.titlePaths.flatMap((path) => readPathValues(record, path)).join(" "),
          80,
        );

        if (!title) {
          return null;
        }

        const description = truncate(
          definition.buildDescription?.(record)
          || definition.descriptionPaths.flatMap((path) => readPathValues(record, path)).join(" · "),
        );
        const navigationSearchTerm = readPathValues(record, definition.searchTermPath)[0] || title;

        const item: AdminSearchItem = {
          id: `${definition.modelName}:${record.id}`,
          label: title,
          description,
          icon: definition.icon,
          to: definition.buildTo?.(record)
            || (
              definition.useSearchParam
                ? `${definition.route}?${new URLSearchParams({["search"]: navigationSearchTerm}).toString()}`
                : definition.route
            ),
        };

        return {
          item,
          title,
          searchTerm: definition.rankWithSearchTerm ? navigationSearchTerm : undefined,
          description,
          fields: Object.fromEntries(searchFieldsToEntries(record, definition.searchFields)),
        };
      })
      .filter((candidate): candidate is SearchCandidate => candidate !== null);

    if (candidates.length === 0) {
      return null;
    }

    const fuse = new Fuse(candidates, {
      includeScore: true,
      ignoreDiacritics: true,
      ignoreLocation: true,
      minMatchCharLength: ADMIN_SEARCH_MIN_QUERY_LENGTH,
      threshold: FUSE_THRESHOLD,
      keys: definition.fuseKeys,
    });

    const items = fuse.search(query, {limit: perGroupLimit})
      .map((result) => ({
        item: result.item.item,
        score: result.score ?? 1,
      }))
      .sort((left, right) => left.score - right.score || left.item.label.localeCompare(right.item.label, "fr"));

    if (items.length === 0) {
      return null;
    }

    return {
      id: definition.modelName.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(),
      label: definition.groupLabel,
      items: items.map((entry) => entry.item),
      minScore: items[0]?.score ?? 1,
    };
  }));

  let remaining = limit;

  return results
    .filter((group): group is AdminSearchGroup & { minScore: number } => group !== null)
    .sort((left, right) => left.minScore - right.minScore || left.label.localeCompare(right.label, "fr"))
    .flatMap((group) => {
      if (remaining <= 0) {
        return [];
      }

      const items = group.items.slice(0, remaining);
      remaining -= items.length;

      return items.length > 0 ? [{id: group.id, label: group.label, items}] : [];
    });
};

const searchFieldsToEntries = (record: SearchRecord, searchFields: SearchFieldDefinition[]) => {
  return searchFields
    .map((field, index) => [`f${index}`, readPathValues(record, field.path).join(" ")] as const)
    .filter(([, value]) => Boolean(value));
};
