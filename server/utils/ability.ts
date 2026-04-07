import { AbilityBuilder, type PureAbility } from "@casl/ability";
import { serverSupabaseUser } from "#supabase/server";
import type { JwtPayload } from "@supabase/supabase-js";
import type { H3Event } from "h3";
import {
  getNonDelegablePermissionKeys,
  type Permission as PermissionKey,
} from "#shared/utils/authorization";
import type { AppPrismaQuery, AppSubject } from "./casl";
import { createPrismaAbility } from "./casl";

const AUTHORIZATION_CACHE_MAX_AGE_SECONDS = 60;

export type AppAbility = PureAbility<[AppAction, AppSubject], AppPrismaQuery>;

type AuthorizationContext = {
  authUser: JwtPayload;
  dbUser: DbUser;
  ability: AppAbility;
};

const getCachedDbUser = defineCachedFunction(async (supabaseAuthId: string): Promise<DbUser> => prisma.user.findUniqueOrThrow({
  where: {supabaseAuthId},
  select: {
    id: true,
    supabaseAuthId: true,
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
  name: "db-user-authorization",
  getKey: (supabaseAuthId: string) => supabaseAuthId,
});

export async function requireSignedInUser(event: H3Event) {
  const authUser = await serverSupabaseUser(event);

  if (!authUser) {
    throw createError({statusCode: 401, statusMessage: "Unauthorized"});
  }

  return authUser;
}

export async function getDbUser(authUser: JwtPayload): Promise<DbUser> {
  if (!authUser.sub) {
    throw createError({statusCode: 401, statusMessage: "Invalid authentication token."});
  }

  try {
    const dbUser = await getCachedDbUser(authUser.sub);
    isDbUserValid(dbUser);
    return dbUser;
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

export function hasRole(dbUser: DbUser, roleKey: string): boolean {
  return getGrantedRoleKeys(dbUser).includes(roleKey);
}

export function isSuperAdmin(dbUser: DbUser): boolean {
  return hasRole(dbUser, "super_admin");
}

export function isDbUserValid(dbUser: DbUser) {
  const hasAdminProfile = dbUser.admin !== null;
  const hasParticipantProfile = dbUser.participant !== null;

  if (hasAdminProfile === hasParticipantProfile) {
    throw createError({
      statusCode: 403,
      statusMessage: "L'utilisateur doit avoir exactement un profil applicatif.",
    });
  }

  const roleKeys = getGrantedRoleKeys(dbUser);
  const hasParticipantRole = roleKeys.includes("participant");
  const hasOrganizerRole = roleKeys.some((roleKey) => roleKey !== "participant");

  if (hasAdminProfile && (hasParticipantRole || !hasOrganizerRole)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Les rôles de l'administrateur ne correspondent pas à son profil.",
    });
  }

  if (hasParticipantProfile && (hasOrganizerRole || !hasParticipantRole)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Les rôles du participant ne correspondent pas à son profil.",
    });
  }
}

export function getNonDelegablePermissionKeysForUser(dbUser: DbUser, permissionKeys: Iterable<string>): string[] {
  return getNonDelegablePermissionKeys({
    roleKeys: getGrantedRoleKeys(dbUser),
    permissionKeys: getGrantedPermissionKeys(dbUser),
  }, permissionKeys);
}

export function assertCanDelegatePermissions(dbUser: DbUser, permissionKeys: Iterable<string>, statusMessage?: string) {
  const nonDelegablePermissionKeys = getNonDelegablePermissionKeysForUser(dbUser, permissionKeys);

  if (nonDelegablePermissionKeys.length === 0) return;

  throw createError({
    statusCode: 403,
    statusMessage: statusMessage ?? "Vous ne pouvez pas déléguer des permissions que vous ne possédez pas.",
  });
}

export function hasOrganizerAccess(dbUser: DbUser): boolean {
  return dbUser.admin !== null
    && dbUser.participant === null
    && getGrantedRoleKeys(dbUser).some((roleKey) => roleKey !== "participant");
}

export function createAbilityForPermissionKeys(permissionKeys: Iterable<PermissionKey>): AppAbility {
  const {can, build} = new AbilityBuilder<AppAbility>(createPrismaAbility);

  for (const permission of permissionKeys) {
    applyPermissionDefinition(permission, can);
  }

  return build();
}

export function createAbilityForUser(dbUser: DbUser): AppAbility {
  return createAbilityForPermissionKeys(getGrantedPermissionKeys(dbUser));
}

export function canUsePermission(ability: AppAbility, permission: PermissionKey) {
  const rule = getPermissionRule(permission);
  return ability.can(rule.action, rule.subject);
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
