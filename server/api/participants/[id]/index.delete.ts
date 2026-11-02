import idParamSchema from "#shared/schemas/id";
import * as v from "valibot";
import { isSuperAdmin } from "#server/utils/ability";
import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "participants.delete");
  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const supabaseAuthId = await deleteParticipantWithCleanup(id, isSuperAdmin(dbUser));

  await invalidateUserAuthorization(supabaseAuthId);
  event.waitUntil(Promise.resolve().then(() => processSupabaseCleanup(serverSupabaseServiceRole(event), "GENERAL")).catch((error) => {
    console.error("Erreur lors du nettoyage des données Supabase du participant:", error);
  }));

  return {success: true, message: "Participant supprimé avec succès."};
});
