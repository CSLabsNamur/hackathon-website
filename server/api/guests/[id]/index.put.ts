import * as v from "valibot";
import idParamSchema from "#shared/schemas/id";
import { guestBodySchema } from "#shared/schemas/guests/create";
import type { GuestUpdateInput } from "~~/server/prisma/generated/prisma/models/Guest";
import formidable from "formidable";
import { fileTypeFromFile } from "file-type";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { serverSupabaseServiceRole } from "#supabase/server";
import { resolveGuestName, resolveGuestQuantity } from "#shared/utils/guests";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "guests.update");

  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const [bodyRaw, files] = await formidable({
    allowEmptyFiles: false,
    keepExtensions: true,
    maxFiles: 1,
    maxFileSize: MAX_GUEST_IMAGE_SIZE,
    multiples: false,
  }).parse(event.node.req);

  const imageFile = files.imageFile?.[0];

  try {
    const bodyFlat = Object.fromEntries(Object.entries(bodyRaw ?? {}).map(([key, value]) => {
      if (Array.isArray(value)) return [key, value[0]];
      return [key, value];
    }));

    const data = v.parse(guestBodySchema, bodyFlat);
    const guest = await prisma.guest.findUnique({where: {id}});

    if (!guest) {
      throw createError({statusCode: 404, statusMessage: "Invité introuvable."});
    }

    const supabase = serverSupabaseServiceRole(event);
    let uploadedPath: string | undefined;

    const payload: GuestUpdateInput = {
      name: resolveGuestName(data.name, data.type),
      type: data.type,
      quantity: resolveGuestQuantity(data.name, data.quantity),
      company: data.company || null,
      imageUrl: guest.imageUrl,
    };

    if (imageFile) {
      const detected = await fileTypeFromFile(imageFile.filepath);
      if (!detected || !ACCEPTED_GUEST_IMAGE_EXTS.includes(detected.ext as typeof ACCEPTED_GUEST_IMAGE_EXTS[number])) {
        throw createError({statusCode: 400, statusMessage: "L'image doit être un PNG, JPG ou WEBP."});
      }

      const scanner = await clamscan;
      if (scanner) {
        const scan = await scanner.scanFile(imageFile.filepath);
        if (scan.isInfected) {
          throw createError({statusCode: 400, statusMessage: "L'image est infectée par un virus."});
        }
      } else {
        console.warn("[guests] ClamAV unavailable; skipping virus scan.");
      }

      const originalName = imageFile.originalFilename || `guest.${detected.ext}`;
      const storagePath = `${randomUUID()}_${sanitizeFilename(originalName)}`;

      const {data: uploadData, error} = await supabase.storage
        .from(GUESTS_BUCKET)
        .upload(storagePath, fs.createReadStream(imageFile.filepath), {
          contentType: detected.mime,
        });

      if (error || !uploadData) {
        throw createError({statusCode: 500, statusMessage: "Erreur lors du téléversement de l'image."});
      }

      uploadedPath = uploadData.path;
      payload.imageUrl = uploadData.path;
    }

    try {
      const updatedGuest = await prisma.guest.update({where: {id}, data: payload});

      if (uploadedPath && guest.imageUrl) {
        const {error} = await supabase.storage.from(GUESTS_BUCKET).remove([guest.imageUrl]);
        if (error) {
          console.error("Erreur lors de la suppression de l'ancienne image invité :", error);
        }
      }

      return updatedGuest;
    } catch (error) {
      if (uploadedPath) {
        await supabase.storage.from(GUESTS_BUCKET).remove([uploadedPath]);
      }
      throw error;
    }
  } finally {
    if (imageFile) {
      try {
        fs.unlinkSync(imageFile.filepath);
      } catch (error) {
        console.warn("[guests] Failed to remove temporary image file.", error);
      }
    }
  }
});
