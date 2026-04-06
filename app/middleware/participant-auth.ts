import { canUsePermissionKeys, getClientAbilityForPermissionKeys } from "~/utils/ability";

export default defineNuxtRouteMiddleware(async (to) => {
  try {
    const {data: participant, error} = await useCurrentParticipant();

    if (error.value || !participant.value) {
      return navigateTo("/");
    }

    const requiredPermissions = (to.meta.requiredPermissions as Permission[] | undefined) ?? [];
    const ability = getClientAbilityForPermissionKeys(participant.value.authorization.permissionKeys);

    if (!canUsePermissionKeys(ability, requiredPermissions)) {
      return navigateTo("/");
    }
  } catch {
    return navigateTo("/");
  }
});
