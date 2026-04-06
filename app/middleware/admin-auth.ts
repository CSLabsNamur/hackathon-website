import { canUsePermissionKeys, getClientAbilityForPermissionKeys } from "~/utils/ability";

export default defineNuxtRouteMiddleware(async (to) => {
  try {
    const {data: admin, error} = await useCurrentAdmin();

    if (error.value || !admin.value) {
      return navigateTo("/");
    }

    const requiredPermissions = (to.meta.requiredPermissions as Permission[] | undefined) ?? [];
    const ability = getClientAbilityForPermissionKeys(admin.value.authorization.permissionKeys);

    if (!canUsePermissionKeys(ability, requiredPermissions)) {
      return navigateTo("/admin");
    }
  } catch {
    return navigateTo("/");
  }
});
