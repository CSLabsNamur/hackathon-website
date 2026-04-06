import { AbilityBuilder, type PureAbility } from "@casl/ability";
import { serverSupabaseUser } from "#supabase/server";
import type { JwtPayload } from "@supabase/supabase-js";
import type { H3Event } from "h3";
import type { Permission as PermissionKey } from "#shared/utils/authorization";
import type { AppPrismaQuery, AppSubject } from "./casl";
import { createPrismaAbility } from "./casl";

const AUTHORIZATION_CACHE_MAX_AGE_SECONDS = 60;

export type AppAbility = PureAbility<[AppAction, AppSubject], AppPrismaQuery>;

type AuthorizationContext = {
  authUser: JwtPayload;
  dbUser: DbUser;
  ability: AppAbility;
};

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
  name: "db-user-authorization",
  getKey: (email: string) => email,
});

export async function requireSignedInUser(event: H3Event) {
  const authUser = await serverSupabaseUser(event);

  if (!authUser) {
    throw createError({statusCode: 401, statusMessage: "Unauthorized"});
  }

  return authUser;
}

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
