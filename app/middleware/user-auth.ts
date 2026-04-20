import { canUsePermissionKeys, getClientAbilityForPermissionKeys } from "~/utils/ability";

export default defineNuxtRouteMiddleware(async (to) => {
  try {
    const {data: user, error} = await useCurrentUser();

    if (error.value || !user.value) {
      return navigateTo("/");
    }

    const requiredPermissions = (to.meta.requiredPermissions as Permission[] | undefined) ?? [];
    const ability = getClientAbilityForPermissionKeys(user.value.authorization.permissionKeys);

    if (!canUsePermissionKeys(ability, requiredPermissions)) {
      return navigateTo("/");
    }
  } catch {
    return navigateTo("/");
  }
});
