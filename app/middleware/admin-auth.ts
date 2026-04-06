import { canUsePermissionKeys, getClientAbilityForPermissionKeys } from "~/utils/ability";

export default defineNuxtRouteMiddleware(async (to) => {
  try {
    const admin = await $fetch<CurrentAdmin>("/api/admins/me", {
      credentials: "same-origin",
      headers: import.meta.server ? useRequestHeaders(["cookie"]) : undefined,
    });

    const requiredPermissions = (to.meta.requiredPermissions as Permission[] | undefined) ?? [];
    const ability = getClientAbilityForPermissionKeys(admin.authorization.permissionKeys);

    if (!canUsePermissionKeys(ability, requiredPermissions)) {
      return navigateTo("/admin");
    }
  } catch {
    return navigateTo("/");
  }
});
