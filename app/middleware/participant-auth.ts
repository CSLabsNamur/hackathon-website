import { canUsePermissionKeys, createClientAbilityForPermissionKeys } from "~/utils/ability";

export default defineNuxtRouteMiddleware(async (to) => {
  try {
    const participant = await $fetch<CurrentParticipant>("/api/participants/me", {
      credentials: "same-origin",
      headers: import.meta.server ? useRequestHeaders(["cookie"]) : undefined,
    });

    const requiredPermissions = (to.meta.requiredPermissions as Permission[] | undefined) ?? [];
    const ability = createClientAbilityForPermissionKeys(participant.authorization.permissionKeys);

    if (!canUsePermissionKeys(ability, requiredPermissions)) {
      return navigateTo("/");
    }
  } catch {
    return navigateTo("/");
  }
});
