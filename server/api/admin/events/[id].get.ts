import * as v from "valibot";
import idSchema from "#shared/schemas/id";
import type { EventArchiveSnapshot } from "#shared/utils/eventArchives";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "settings.read");
  const {id} = await getValidatedRouterParams(event, v.parser(idSchema));
  const archive = await prisma.eventArchive.findUnique({where: {id}});
  if (!archive) throw createError({statusCode: 404, statusMessage: "Archive introuvable."});
  return {...archive, snapshot: archive.snapshot as EventArchiveSnapshot};
});
