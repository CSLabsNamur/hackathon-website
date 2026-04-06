import { AbilityBuilder, type PureAbility } from "@casl/ability";
import { serverSupabaseUser } from "#supabase/server";
import type { JwtPayload } from "@supabase/supabase-js";
import type { H3Event } from "h3";
import type { Permission as PermissionKey } from "../../shared/utils/authorization";
import type { DbUser } from "../../shared/utils/types";
import type { AppAction, AppPrismaQuery, AppSubject } from "./casl";
import { createPrismaAbility } from "./casl";

const AUTHORIZATION_CACHE_MAX_AGE_SECONDS = 60;

export type AppAbility = PureAbility<[AppAction, AppSubject], AppPrismaQuery>;

type AuthorizationContext = {
  authUser: JwtPayload;
  dbUser: DbUser;
  ability: AppAbility;
};

type PermissionContext = {
  can: AbilityBuilder<AppAbility>["can"];
};

type PermissionDefinition = {
  action: AppAction;
  subject: Extract<AppSubject, string>;
  apply: (context: PermissionContext) => void;
};

const PERMISSION_DEFINITIONS: Record<PermissionKey, PermissionDefinition> = {
  "participants.read.own": {
    action: "readOwn",
    subject: "Participant",
    apply: ({can}) => can("readOwn", "Participant"),
  },
  "participants.update.own": {
    action: "updateOwn",
    subject: "Participant",
    apply: ({can}) => can("updateOwn", "Participant"),
  },
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
  "teams.read.own": {
    action: "readOwn",
    subject: "Team",
    apply: ({can}) => can("readOwn", "Team"),
  },
  "teams.create.own": {
    action: "createOwn",
    subject: "Team",
    apply: ({can}) => can("createOwn", "Team"),
  },
  "teams.update.own": {
    action: "updateOwn",
    subject: "Team",
    apply: ({can}) => can("updateOwn", "Team"),
  },
  "teams.join": {
    action: "join",
    subject: "Team",
    apply: ({can}) => can("join", "Team"),
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
  "submissions.read.own": {
    action: "readOwn",
    subject: "Submission",
    apply: ({can}) => can("readOwn", "Submission"),
  },
  "submissions.update.own": {
    action: "updateOwn",
    subject: "Submission",
    apply: ({can}) => can("updateOwn", "Submission"),
  },
  "submissions.delete.own": {
    action: "deleteOwn",
    subject: "Submission",
    apply: ({can}) => can("deleteOwn", "Submission"),
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
  "schedule.create": {
    action: "create",
    subject: "ScheduleItem",
    apply: ({can}) => can("create", "ScheduleItem"),
  },
  "schedule.update": {
    action: "update",
    subject: "ScheduleItem",
    apply: ({can}) => can("update", "ScheduleItem"),
  },
  "schedule.delete": {
    action: "delete",
    subject: "ScheduleItem",
    apply: ({can}) => can("delete", "ScheduleItem"),
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
      statusMessage: `Permission non implémentée : ${permission}`,
    });
  }

  return definition;
}

export function canUsePermission(ability: AppAbility, permission: PermissionKey) {
  const definition = getPermissionDefinition(permission);
  return ability.can(definition.action, definition.subject);
}

export async function requireSignedInUser(event: H3Event) {
  const authUser = await serverSupabaseUser(event);

  if (!authUser) {
    throw createError({statusCode: 401, statusMessage: "Unauthorized"});
  }

  return authUser;
}

const getCachedDbUser = defineCachedFunction(async (email: string): Promise<DbUser> => prisma.user.findUniqueOrThrow({
  where: {email},
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    admin: {
      select: {
        id: true,
        userId: true,
      },
    },
    participant: {
      select: {
        id: true,
        userId: true,
      },
    },
    roleAssignments: {
      select: {
        role: {
          select: {
            key: true,
            permissions: {
              select: {
                permission: {
                  select: {
                    key: true,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}), {
  maxAge: AUTHORIZATION_CACHE_MAX_AGE_SECONDS,
  name: "app-user-authorization",
  getKey: (email: string) => email,
});

export async function getDbUser(authUser: JwtPayload): Promise<DbUser> {
  try {
    return await getCachedDbUser(authUser.email!);
  } catch {
    throw createError({statusCode: 403, statusMessage: "User is not authorized in the application."});
  }
}

export function getGrantedPermissionKeys(dbUser: DbUser): PermissionKey[] {
  const permissionKeys = new Set<PermissionKey>();

  for (const assignment of dbUser.roleAssignments) {
    for (const rolePermission of assignment.role.permissions) {
      permissionKeys.add(rolePermission.permission.key as PermissionKey);
    }
  }

  return [...permissionKeys];
}

export function getGrantedRoleKeys(dbUser: DbUser): string[] {
  return [...new Set(dbUser.roleAssignments.map((assignment) => assignment.role.key))];
}

export function hasOrganizerAccess(dbUser: DbUser): boolean {
  return getGrantedRoleKeys(dbUser).some((roleKey) => roleKey !== "participant");
}

export function createAbilityForUser(dbUser: DbUser): AppAbility {
  return createAbilityForPermissionKeys(getGrantedPermissionKeys(dbUser));
}

export function createAbilityForPermissionKeys(permissionKeys: Iterable<PermissionKey>): AppAbility {
  const {can, build} = new AbilityBuilder<AppAbility>(createPrismaAbility);

  for (const permission of permissionKeys) {
    getPermissionDefinition(permission).apply({can});
  }

  return build();
}

/**
 * Creates a CASL ability for the current request, based on the signed-in user and their permissions.
 * The result is cached in the request context for subsequent calls within the same request.
 *
 * @param event The H3 event of the current request
 * @returns The authorization context containing the authenticated user, their database user record, and their CASL ability
 * @throws An error if there is no signed-in user or if the user is not authorized in the application
 */
export async function createAbilityForRequest(event: H3Event): Promise<AuthorizationContext> {
  const cachedContext = event.context.authorizationContext as AuthorizationContext | undefined;
  if (cachedContext) return cachedContext;

  const authUser = await requireSignedInUser(event);
  const dbUser = await getDbUser(authUser);

  const context = {
    authUser,
    dbUser,
    ability: createAbilityForUser(dbUser),
  };

  event.context.authorizationContext = context;

  return context;
}

export async function requirePermission(event: H3Event, permission: PermissionKey) {
  const context = await createAbilityForRequest(event);

  if (!canUsePermission(context.ability, permission)) {
    throw createError({statusCode: 403, statusMessage: "Forbidden"});
  }

  return context;
}

export async function requireOrganizerAccess(event: H3Event) {
  const context = await createAbilityForRequest(event);

  if (!hasOrganizerAccess(context.dbUser)) {
    throw createError({statusCode: 403, statusMessage: "Forbidden"});
  }

  return context;
}
