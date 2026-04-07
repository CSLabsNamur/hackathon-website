import { type MaybeRefOrGetter, toValue } from "vue";
import type { CurrentAdmin } from "#shared/utils/types";
import { getNonDelegablePermissionKeys } from "#shared/utils/authorization";

type CurrentAdminLike = MaybeRefOrGetter<CurrentAdmin | null | undefined>;

export function canDelegatePermissionKeys(currentAdmin: CurrentAdminLike, permissionKeys: Iterable<string>) {
  return getNonDelegablePermissionKeys(toValue(currentAdmin)?.authorization, permissionKeys).length === 0;
}

export function getDelegatedPermissionKeys(admin: MaybeRefOrGetter<Admin>, roles: MaybeRefOrGetter<Role[] | undefined>) {
  const adminValue = toValue(admin);

  const rolesById = computed(() => new Map((toValue(roles) ?? []).map((role) => [role.id, role])));

  const organizerRoleIds = adminValue.user.roleAssignments
    .filter((assignment) => assignment.role.key !== "participant")
    .map((assignment) => assignment.roleId);
  const organizerRoles = organizerRoleIds.map((roleId) => rolesById.value.get(roleId));

  if (organizerRoles.some((role) => !role)) return null;

  return organizerRoles.flatMap((role) => role!.permissions.map((permission) => permission.key));
}

export function canManageRoleAssignments(admin: MaybeRefOrGetter<Admin>, currentAdmin: CurrentAdminLike, roles: MaybeRefOrGetter<Role[] | undefined>) {
  const permissionKeys = getDelegatedPermissionKeys(admin, roles);
  if (!permissionKeys) return false;

  return canDelegatePermissionKeys(currentAdmin, permissionKeys);
}
