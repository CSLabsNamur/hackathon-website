import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event, "settings.update");
  return processSupabaseCleanup(serverSupabaseServiceRole(event), "ROLLOVER");
});
