export default defineNuxtRouteMiddleware(async (to) => {
  try {
    const participant = await $fetch<CurrentParticipant>("/api/participants/me", {
      credentials: "same-origin",
      headers: import.meta.server ? useRequestHeaders(["cookie"]) : undefined,
    });

    const requiredPermissions = (to.meta.requiredPermissions as Permission[] | undefined) ?? [];

    if (requiredPermissions.length > 0 && !requiredPermissions.every((permission) => participant.authorization.permissionKeys.includes(permission))) {
      return navigateTo("/");
    }
  } catch {
    return navigateTo("/");
  }
});
