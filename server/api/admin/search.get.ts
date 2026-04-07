import * as v from "valibot";
import adminSearchQuerySchema from "#shared/schemas/admin/search";

export default defineEventHandler(async (event): Promise<AdminSearchResponse> => {
  const context = await requireOrganizerAccess(event);

  const {query, limit} = await getValidatedQuery(event, v.parser(adminSearchQuerySchema));

  if (query.length < ADMIN_SEARCH_MIN_QUERY_LENGTH) {
    return {
      groups: [],
    };
  }

  const allowedModelNames = Object.entries(SEARCH_MODEL_PERMISSIONS)
    .filter(([, permissions]) => permissions.every((permission) => canUsePermission(context.ability, permission)))
    .map(([modelName]) => modelName as AdminSearchModelName);

  const groups = await searchAdminIndex(query, limit, allowedModelNames, getGrantedPermissionKeys(context.dbUser));

  return {
    groups,
  };
});
