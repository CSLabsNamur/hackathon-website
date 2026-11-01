import * as v from "valibot";
import idParamSchema from "#shared/schemas/id";
import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "guests.delete");
  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const guest = await deleteGuestWithCleanup(id);
  event.waitUntil(Promise.resolve().then(() => processSupabaseCleanup(serverSupabaseServiceRole(event), "GENERAL")).catch((error) => {
    console.error("Erreur lors du nettoyage des fichiers Supabase:", error);
  }));

  return guest;
});
