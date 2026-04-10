import * as v from "valibot";
import { adminExportResourceParamsSchema } from "#shared/schemas/admin/export";

export default defineEventHandler(async (event) => {
  // The permissions are checked in more details while getting the requested schema, in getAdminExportSchemaDefinition.
  const context = await requireOrganizerAccess(event);

  const {resource} = await getValidatedRouterParams(event, v.parser(adminExportResourceParamsSchema));

  return getAdminExportSchemaDefinition(resource, getGrantedPermissionKeys(context.dbUser));
});
