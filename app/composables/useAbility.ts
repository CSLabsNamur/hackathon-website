import type { MaybeRefOrGetter } from "vue";

export const useAbility = (user: MaybeRefOrGetter<CurrentAuthorizedUser | null | undefined>) => {
  const ability = computed(() => createClientAbilityForPermissionKeys(toValue(user)?.authorization.permissionKeys ?? []));

  const can = (action: AppAction, subject: AppSubjectName) => ability.value.can(action, subject);
  const cannot = (action: AppAction, subject: AppSubjectName) => ability.value.cannot(action, subject);
  const canPermission = (permission: Permission) => canUsePermissionKey(ability.value, permission);
  const canPermissions = (permissions?: readonly Permission[]) => canUsePermissionKeys(ability.value, permissions);

  return {
    ability,
    can,
    cannot,
    canPermission,
    canPermissions,
  };
};
