import { AbilityBuilder, createMongoAbility, type MongoAbility } from "@casl/ability";

export type ClientAppAbility = MongoAbility<[AppAction, AppSubjectName]>;

type AbilityLike = {
  can: (action: AppAction, subject: AppSubjectName) => boolean;
};

export function createClientAbilityForPermissionKeys(permissionKeys: readonly Permission[] = []): ClientAppAbility {
  const {can, build} = new AbilityBuilder<ClientAppAbility>(createMongoAbility);

  for (const permission of permissionKeys) {
    applyPermissionDefinition(permission, can);
  }

  return build();
}

export function canUsePermissionKey(ability: AbilityLike, permission: Permission) {
  const rule = getPermissionRule(permission);
  return ability.can(rule.action, rule.subject);
}

export function canUsePermissionKeys(ability?: AbilityLike | null, permissions?: readonly Permission[]) {
  if (!permissions?.length) return true;
  if (!ability) return false;
  return permissions.every((permission) => canUsePermissionKey(ability, permission));
}
