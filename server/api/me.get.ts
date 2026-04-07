import { serverSupabaseUser } from "#supabase/server";
import type { CurrentUser } from "#shared/utils/types";

export default defineEventHandler(async (event) => {
  const authUser = await serverSupabaseUser(event);
  if (!authUser) return null;

  const dbUser = await getDbUser(authUser);

  return {
    kind: dbUser.admin ? "admin" : "participant",
    user: {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
    },
    authorization: {
      roleKeys: getGrantedRoleKeys(dbUser),
      permissionKeys: getGrantedPermissionKeys(dbUser),
    },
  } satisfies CurrentUser;
});
