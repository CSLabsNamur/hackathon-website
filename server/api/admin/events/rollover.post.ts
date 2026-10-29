import * as v from "valibot";
import schema from "#shared/schemas/settings/rollover";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, "settings.update");
  const input = await readValidatedBody(event, v.parser(schema));
  const result = await rolloverEvent(input);
  await invalidateEventBadgeLogoPath();
  return result;
});
