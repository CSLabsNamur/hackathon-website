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

  const groups = await searchAdminIndex(query, limit, getGrantedPermissionKeys(context.dbUser));

  return {
    groups,
  };
});
