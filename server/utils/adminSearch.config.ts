/**
 * This file is 80% AI generated.
 */
import type { GuestType, SubmissionType } from "#shared/utils/types";
import type { Permission } from "#shared/utils/authorization";

export type SearchValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined
  | SearchRecord
  | SearchValue[];

export interface SearchRecord {
  id: string;

  [key: string]: SearchValue;
}

export type AdminSearchModelName =
  | "Participant"
  | "Team"
  | "Guest"
  | "Sponsor"
  | "SubmissionRequest"
  | "Room"
  | "Admin"
  | "Role";

export type AdminSearchFieldMatch = "contains" | "string_contains" | "has" | "equals";

/**
 * Configuration for a field path, i.e. its relation cardinality, the operator to use, and its relative weight for ranking.
 */
export interface AdminSearchPathConfig {
  path: string;
  /** Relation cardinality for each relation existing to get to the field. Used to wrap filters with `is` or `some` */
  relationModes?: readonly ("one" | "many")[];
  /** Prisma operator to use for the field. Set if the default one isn't correct, e.g. scalar arrays */
  match?: AdminSearchFieldMatch;
  /** Relative Fuse ranking weight for this field compared to the other fields of the same model */
  weight?: number;
  /** Extra permissions required to include this field in search/indexing */
  requiredPermissions?: readonly Permission[];
}

/**
 * Configuration for a model, used to build the Prisma query, the Fuse index, and the displayed result sections.
 */
export interface AdminSearchModelConfig {
  /** Permissions required to include this model in global search */
  requiredPermissions: readonly Permission[];
  route: string;
  /** Label for the result group, usually the plural of the model name */
  groupLabel: string;
  /** Icon name, using Nuxt UI's icon system */
  icon: string;
  /** Paths used to build the result title */
  titlePaths: readonly string[];
  /** Paths used to build the description */
  descriptionPaths?: readonly string[];
  /** Path whose first extracted value is reused for ranking and for the destination `?search=` query */
  searchTermPath?: string;
  /** Set to `false` when clicking a result shouldn't append `?search=<search term>` */
  useSearchParam?: boolean;
  /** Explicit fields queried in Prisma and indexed in Fuse for this model */
  searchFields: readonly AdminSearchPathConfig[];
  /** Preferred field for the initial Prisma fetch order, typically updatedAt or createdAt. Defaults to updatedAt */
  orderBy?: string;
  /** Optional formatter for richer result titles than joining `titlePaths` */
  buildTitle?: (record: SearchRecord) => string | undefined;
  /** Optional formatter for richer result descriptions than joining `descriptionPaths` */
  buildDescription?: (record: SearchRecord) => string | undefined;
  /** Optional custom destination builder for result links */
  buildTo?: (record: SearchRecord) => string;
}

const getString = (value: SearchValue): string | undefined => {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
};

const joinText = (...parts: Array<string | undefined>) => {
  return parts.filter(Boolean).join(" · ");
};

const truncate = (value: string | undefined, maxLength = 96) => {
  if (!value) return undefined;

  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return undefined;
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
};

export const ADMIN_SEARCH_MODEL_CONFIGS: Record<AdminSearchModelName, AdminSearchModelConfig> = {
  Participant: {
    requiredPermissions: ["participants.read"],
    route: "/admin/participants",
    groupLabel: "Participants",
    icon: "i-lucide-user-check",
    titlePaths: ["user.firstName", "user.lastName"],
    descriptionPaths: ["user.email", "team.name", "school"],
    searchTermPath: "user.email",
    orderBy: "updatedAt",
    searchFields: [
      {path: "id"},
      {path: "githubAccount"},
      {path: "linkedInAccount"},
      {path: "school"},
      {path: "diet", requiredPermissions: ["participants.read.sensitive"]},
      {path: "needs", requiredPermissions: ["participants.read.sensitive"]},
      {path: "user.firstName", relationModes: ["one"], weight: 4},
      {path: "user.lastName", relationModes: ["one"], weight: 4},
      {path: "user.email", relationModes: ["one"], weight: 5},
      {path: "team.name", relationModes: ["one"], weight: 3},
    ],
  },
  Team: {
    requiredPermissions: ["teams.read", "participants.read"],
    route: "/admin/teams",
    groupLabel: "Équipes",
    icon: "i-lucide-users",
    titlePaths: ["name"],
    descriptionPaths: ["idea", "description", "room.name"],
    orderBy: "updatedAt",
    searchFields: [
      {path: "id"},
      {path: "name"},
      {path: "description"},
      {path: "idea"},
      {path: "token"},
      {path: "members.user.firstName", relationModes: ["many", "one"], weight: 2},
      {path: "members.user.lastName", relationModes: ["many", "one"], weight: 2},
      {path: "members.user.email", relationModes: ["many", "one"], weight: 2},
      {path: "room.name", relationModes: ["one"], weight: 2},
    ],
  },
  Guest: {
    requiredPermissions: ["guests.read"],
    route: "/admin/guests",
    groupLabel: "Invités",
    icon: "i-lucide-id-card",
    titlePaths: ["name"],
    descriptionPaths: ["type", "company", "quantity"],
    orderBy: "updatedAt",
    searchFields: [
      {path: "id"},
      {path: "name"},
      {path: "company"},
      {path: "quantity", match: "equals"},
    ],
    buildDescription: (record) => {
      const type = getString(record.type) as GuestType | undefined;
      const quantity = typeof record.quantity === "number" ? record.quantity : undefined;

      return joinText(
        type ? translateGuestType(type) : undefined,
        getString(record.company),
        quantity && quantity > 1 ? `${quantity} badges` : undefined,
      );
    },
  },
  Sponsor: {
    requiredPermissions: ["sponsors.read"],
    route: "/admin/sponsors",
    groupLabel: "Sponsors",
    icon: "i-lucide-handshake",
    titlePaths: ["name"],
    orderBy: "updatedAt",
    searchFields: [
      {path: "id"},
      {path: "name"},
      {path: "description", match: "string_contains"},
      {path: "url"},
    ],
    buildDescription: (record) => {
      return truncate(richTextToPlainText(normalizeRichTextDocument(record.description)), 96) || getString(record.url);
    },
  },
  SubmissionRequest: {
    requiredPermissions: ["submissionRequests.read", "participants.read"],
    route: "/admin/submissions-requests",
    groupLabel: "Demandes de soumission",
    icon: "i-lucide-file-text",
    titlePaths: ["title"],
    descriptionPaths: ["type", "deadline", "description"],
    orderBy: "updatedAt",
    searchFields: [
      {path: "id"},
      {path: "title"},
      {path: "description"},
      {path: "acceptedFormats", match: "has", weight: 2},
    ],
    buildDescription: (record) => {
      const type = getString(record.type) as SubmissionType | undefined;

      return joinText(
        type ? submissionTypeTranslateMap[type] : undefined,
        record.deadline instanceof Date || typeof record.deadline === "string"
          ? new Intl.DateTimeFormat("fr-BE", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(record.deadline))
          : undefined,
        truncate(getString(record.description), 72),
      );
    },
  },
  Room: {
    requiredPermissions: ["rooms.read", "teams.read"],
    route: "/admin/rooms",
    groupLabel: "Salles",
    icon: "i-lucide-door-open",
    titlePaths: ["name"],
    useSearchParam: false,
    orderBy: "updatedAt",
    searchFields: [
      {path: "id"},
      {path: "name"},
      {path: "sequence", match: "equals"},
      {path: "teams.name", relationModes: ["many"], weight: 2},
    ],
    buildDescription: (record) => {
      const teams = Array.isArray(record.teams) ? record.teams : [];

      return joinText(
        typeof record.sequence === "number" ? `Ordre ${record.sequence}` : undefined,
        `${teams.length} équipe(s)`,
      );
    },
    buildTo: (record) => `/admin/rooms#room-${record.id}`,
  },
  Admin: {
    requiredPermissions: ["admins.read", "roles.read"],
    route: "/admin/admins",
    groupLabel: "Administrateurs",
    icon: "i-lucide-shield-plus",
    titlePaths: ["user.firstName", "user.lastName"],
    descriptionPaths: ["user.email"],
    searchTermPath: "user.email",
    orderBy: "updatedAt",
    searchFields: [
      {path: "id"},
      {path: "user.firstName", relationModes: ["one"], weight: 4},
      {path: "user.lastName", relationModes: ["one"], weight: 4},
      {path: "user.email", relationModes: ["one"], weight: 5},
    ],
  },
  Role: {
    requiredPermissions: ["roles.read"],
    route: "/admin/roles",
    groupLabel: "Rôles",
    icon: "i-lucide-shield-check",
    titlePaths: ["name"],
    descriptionPaths: ["description"],
    orderBy: "updatedAt",
    searchFields: [
      {path: "id"},
      {path: "name"},
      {path: "description"},
    ],
  },
};
