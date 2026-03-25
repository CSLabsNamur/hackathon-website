import * as v from "valibot";
import idParamSchema from "#shared/schemas/id";
import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));
  const sponsor = await prisma.sponsor.findUnique({where: {id}});

  if (!sponsor) {
    throw createError({statusCode: 404, statusMessage: "Sponsor introuvable."});
  }

  const supabase = serverSupabaseServiceRole(event);
  const {error} = await supabase.storage.from(SPONSORS_BUCKET).remove([sponsor.logo]);
  if (error) {
    throw createError({statusCode: 500, statusMessage: "Erreur lors de la suppression du logo."});
  }

  return prisma.sponsor.delete({where: {id}});
});
