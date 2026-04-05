export default defineNuxtRouteMiddleware(async (to) => {
  try {
    const admin = await $fetch<CurrentAdmin>("/api/admins/me", {
      credentials: "same-origin",
      headers: import.meta.server ? useRequestHeaders(["cookie"]) : undefined,
    });

    const requiredPermissions = (to.meta.requiredPermissions as Permission[] | undefined) ?? [];

    if (requiredPermissions.length > 0 && !requiredPermissions.every((permission) => admin.authorization.permissionKeys.includes(permission))) {
      return navigateTo("/admin");
    }
  } catch {
    return navigateTo("/");
  }
});
