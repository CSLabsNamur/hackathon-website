import { AbilityBuilder, type PureAbility } from "@casl/ability";
import { serverSupabaseUser } from "#supabase/server";
import type { JwtPayload } from "@supabase/supabase-js";
import type { H3Event } from "h3";
import type { Permission as PermissionKey } from "#shared/utils/authorization";
import type { Prisma } from "../prisma/generated/prisma/client";
import type { AppAction, AppPrismaQuery, AppSubject } from "./casl";
import { createPrismaAbility } from "./casl";

type UserWithAuthorization = Prisma.UserGetPayload<{
  include: {
    admin: true;
    participant: true;
    roleAssignments: {
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true;
              };
            };
          };
        };
      };
    };
  };
}>;

export type AppAbility = PureAbility<[AppAction, AppSubject], AppPrismaQuery>;

type PermissionContext = {
  can: AbilityBuilder<AppAbility>["can"];
  cannot: AbilityBuilder<AppAbility>["cannot"];
};
type PermissionDefinition = {
  action: AppAction;
  subject: Extract<AppSubject, string>;
  apply: (context: PermissionContext) => void;
};

const PERMISSION_DEFINITIONS: Record<PermissionKey, PermissionDefinition> = {
  "participants.read": {
    action: "read",
    subject: "Participant",
    apply: ({can}) => can("read", "Participant"),
  },
  "participants.read.sensitive": {
    action: "readSensitive",
    subject: "Participant",
    apply: ({can}) => can("readSensitive", "Participant"),
  },
  "participants.check_in": {
    action: "checkIn",
    subject: "Participant",
    apply: ({can}) => can("checkIn", "Participant"),
  },
  "participants.update": {
    action: "update",
    subject: "Participant",
    apply: ({can}) => can("update", "Participant"),
  },
  "participants.update.sensitive": {
    action: "updateSensitive",
    subject: "Participant",
    apply: ({can}) => can("updateSensitive", "Participant"),
  },
  "participants.delete": {
    action: "delete",
    subject: "Participant",
    apply: ({can}) => can("delete", "Participant"),
  },
  "participants.export": {
    action: "export",
    subject: "Participant",
    apply: ({can}) => can("export", "Participant"),
  },
  "participants.export.sensitive": {
    action: "exportSensitive",
    subject: "Participant",
    apply: ({can}) => can("exportSensitive", "Participant"),
  },
  "teams.read": {
    action: "read",
    subject: "Team",
    apply: ({can}) => can("read", "Team"),
  },
  "teams.update": {
    action: "update",
    subject: "Team",
    apply: ({can}) => can("update", "Team"),
  },
  "teams.delete": {
    action: "delete",
    subject: "Team",
    apply: ({can}) => can("delete", "Team"),
  },
  "teams.export": {
    action: "export",
    subject: "Team",
    apply: ({can}) => can("export", "Team"),
  },
  "guests.read": {
    action: "read",
    subject: "Guest",
    apply: ({can}) => can("read", "Guest"),
  },
  "guests.create": {
    action: "create",
    subject: "Guest",
    apply: ({can}) => can("create", "Guest"),
  },
  "guests.update": {
    action: "update",
    subject: "Guest",
    apply: ({can}) => can("update", "Guest"),
  },
  "guests.delete": {
    action: "delete",
    subject: "Guest",
    apply: ({can}) => can("delete", "Guest"),
  },
  "guests.export": {
    action: "export",
    subject: "Guest",
    apply: ({can}) => can("export", "Guest"),
  },
  "sponsors.read": {
    action: "read",
    subject: "Sponsor",
    apply: ({can}) => can("read", "Sponsor"),
  },
  "sponsors.create": {
    action: "create",
    subject: "Sponsor",
    apply: ({can}) => can("create", "Sponsor"),
  },
  "sponsors.update": {
    action: "update",
    subject: "Sponsor",
    apply: ({can}) => can("update", "Sponsor"),
  },
  "sponsors.delete": {
    action: "delete",
    subject: "Sponsor",
    apply: ({can}) => can("delete", "Sponsor"),
  },
  "sponsors.export": {
    action: "export",
    subject: "Sponsor",
    apply: ({can}) => can("export", "Sponsor"),
  },
  "broadcasts.send": {
    action: "send",
    subject: "Broadcast",
    apply: ({can}) => can("send", "Broadcast"),
  },
  "submissionRequests.read": {
    action: "read",
    subject: "SubmissionRequest",
    apply: ({can}) => can("read", "SubmissionRequest"),
  },
  "submissionRequests.create": {
    action: "create",
    subject: "SubmissionRequest",
    apply: ({can}) => can("create", "SubmissionRequest"),
  },
  "submissionRequests.update": {
    action: "update",
    subject: "SubmissionRequest",
    apply: ({can}) => can("update", "SubmissionRequest"),
  },
  "submissionRequests.delete": {
    action: "delete",
    subject: "SubmissionRequest",
    apply: ({can}) => can("delete", "SubmissionRequest"),
  },
  "submissionRequests.export": {
    action: "export",
    subject: "SubmissionRequest",
    apply: ({can}) => can("export", "SubmissionRequest"),
  },
  "rooms.read": {
    action: "read",
    subject: "Room",
    apply: ({can}) => can("read", "Room"),
  },
  "rooms.create": {
    action: "create",
    subject: "Room",
    apply: ({can}) => can("create", "Room"),
  },
  "rooms.update": {
    action: "update",
    subject: "Room",
    apply: ({can}) => can("update", "Room"),
  },
  "rooms.assign.team": {
    action: "assign",
    subject: "Room",
    apply: ({can}) => can("assign", "Room"),
  },
  "rooms.delete": {
    action: "delete",
    subject: "Room",
    apply: ({can}) => can("delete", "Room"),
  },
  "rooms.export": {
    action: "export",
    subject: "Room",
    apply: ({can}) => can("export", "Room"),
  },
  "badges.print": {
    action: "print",
    subject: "Badge",
    apply: ({can}) => can("print", "Badge"),
  },
  "admins.read": {
    action: "read",
    subject: "Admin",
    apply: ({can}) => can("read", "Admin"),
  },
  "admins.create": {
    action: "create",
    subject: "Admin",
    apply: ({can}) => can("create", "Admin"),
  },
  "admins.update": {
    action: "update",
    subject: "Admin",
    apply: ({can}) => can("update", "Admin"),
  },
  "admins.delete": {
    action: "delete",
    subject: "Admin",
    apply: ({can}) => can("delete", "Admin"),
  },
  "roles.read": {
    action: "read",
    subject: "Role",
    apply: ({can}) => can("read", "Role"),
  },
  "roles.create": {
    action: "create",
    subject: "Role",
    apply: ({can}) => can("create", "Role"),
  },
  "roles.update": {
    action: "update",
    subject: "Role",
    apply: ({can}) => can("update", "Role"),
  },
  "roles.delete": {
    action: "delete",
    subject: "Role",
    apply: ({can}) => can("delete", "Role"),
  },
};

function getPermissionDefinition(permission: PermissionKey): PermissionDefinition {
  const definition = PERMISSION_DEFINITIONS[permission];

  if (!definition) {
    throw createError({
      statusCode: 500,
      statusMessage: `Permission non implémentée dans l'évaluateur CASL: ${permission}`,
    });
  }

  return definition;
}

export async function requireSignedInUser(event: H3Event) {
  const user = await serverSupabaseUser(event);

  if (!user) {
    throw createError({statusCode: 401, statusMessage: "Unauthorized"});
  }

  if (!user.email) {
    throw createError({statusCode: 401, statusMessage: "Authenticated user has no email."});
  }

  return user;
}

export async function getUserWithAuthorization(user: JwtPayload): Promise<UserWithAuthorization> {
  try {
    return await prisma.user.findUniqueOrThrow({
      where: {
        email: user.email!,
      },
      include: {
        admin: true,
        participant: true,
        roleAssignments: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  } catch {
    throw createError({statusCode: 403, statusMessage: "User is not authorized in the application."});
  }
}

export function createAbilityForUser(user: UserWithAuthorization): AppAbility {
  const {can, cannot, build} = new AbilityBuilder<AppAbility>(createPrismaAbility);

  const permissionKeys = new Set<PermissionKey>();

  for (const assignment of user.roleAssignments) {
    for (const rolePermission of assignment.role.permissions) {
      permissionKeys.add(rolePermission.permission.key as PermissionKey);
    }
  }

  for (const permission of permissionKeys) {
    getPermissionDefinition(permission).apply({can, cannot});
  }

  return build();
}

export async function createAbilityForRequest(event: H3Event) {
  const user = await requireSignedInUser(event);
  const dbUser = await getUserWithAuthorization(user);

  return {
    user,
    dbUser,
    ability: createAbilityForUser(dbUser),
  };
}

export function canUsePermission(ability: AppAbility, permission: PermissionKey) {
  const definition = getPermissionDefinition(permission);
  return ability.can(definition.action, definition.subject);
}

export async function requirePermission(event: H3Event, permission: PermissionKey) {
  const context = await createAbilityForRequest(event);

  if (!canUsePermission(context.ability, permission)) {
    throw createError({statusCode: 403, statusMessage: "Forbidden"});
  }

  return context;
}
