import * as v from "valibot";
import idParamSchema from "#shared/schemas/id";
import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "sponsors.delete");
  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const sponsor = await deleteSponsorWithCleanup(id);
  event.waitUntil(Promise.resolve().then(() => processSupabaseCleanup(serverSupabaseServiceRole(event), "GENERAL")).catch((error) => {
    console.error("Erreur lors du nettoyage des fichiers Supabase:", error);
  }));

  return sponsor;
});
