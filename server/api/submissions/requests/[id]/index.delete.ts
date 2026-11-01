import idParamSchema from "#shared/schemas/id";
import * as v from "valibot";
import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "submissionRequests.delete");
  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const submissionRequest = await deleteSubmissionRequestWithCleanup(id, isSuperAdmin(dbUser));
  event.waitUntil(Promise.resolve().then(() => processSupabaseCleanup(serverSupabaseServiceRole(event), "GENERAL")).catch((error) => {
    console.error("Erreur lors du nettoyage des fichiers Supabase:", error);
  }));

  return submissionRequest;
});
