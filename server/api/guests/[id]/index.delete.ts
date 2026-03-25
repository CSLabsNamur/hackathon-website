import * as v from "valibot";
import idParamSchema from "#shared/schemas/id";
import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));
  const guest = await prisma.guest.findUnique({where: {id}});

  if (!guest) {
    throw createError({statusCode: 404, statusMessage: "Invité introuvable."});
  }

  if (guest.imageUrl) {
    const supabase = serverSupabaseServiceRole(event);
    const {error} = await supabase.storage.from(GUESTS_BUCKET).remove([guest.imageUrl]);
    if (error) {
      throw createError({statusCode: 500, statusMessage: "Erreur lors de la suppression de l'image."});
    }
  }

  return prisma.guest.delete({where: {id}});
});
