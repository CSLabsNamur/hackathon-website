import * as v from "valibot";
import { adminExportBodySchema, adminExportResourceParamsSchema } from "#shared/schemas/admin/export";

export default defineEventHandler(async (event) => {
  // The permissions are checked in more details while getting the requested schema, in getAdminExportSchemaDefinition.
  const context = await requireOrganizerAccess(event);

  const {resource} = await getValidatedRouterParams(event, v.parser(adminExportResourceParamsSchema));
  const {format, columnIds} = await readValidatedBody(event, v.parser(adminExportBodySchema));

  const file = await generateAdminExportFile(resource, format, columnIds, getGrantedPermissionKeys(context.dbUser));

  setHeader(event, "Content-Type", file.contentType);
  setHeader(event, "Content-Disposition", `attachment; filename="${file.filename}"`);

  return file.data;
});
