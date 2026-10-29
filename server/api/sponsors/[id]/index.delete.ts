import * as v from "valibot";
import idParamSchema from "#shared/schemas/id";
import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "sponsors.delete");

  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));
  const sponsor = await prisma.sponsor.findUnique({where: {id}});

  if (!sponsor) {
    throw createError({statusCode: 404, statusMessage: "Sponsor introuvable."});
  }

  // Delete the row first: if rollover archived it meanwhile, no archived logo is removed.
  const deletedSponsor = await prisma.sponsor.delete({where: {id}});

  const supabase = serverSupabaseServiceRole(event);
  const {error} = await supabase.storage.from(SPONSORS_BUCKET).remove([sponsor.logo]);
  if (error) {
    await prisma.supabaseCleanupJob.create({data: {type: "STORAGE_OBJECT", bucket: SPONSORS_BUCKET, target: sponsor.logo}});
    throw createError({statusCode: 500, statusMessage: "Erreur lors de la suppression du logo."});
  }

  return deletedSponsor;
});
