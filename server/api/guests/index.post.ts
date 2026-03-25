import * as v from "valibot";
import { guestBodySchema } from "#shared/schemas/guests/create";
import type { GuestCreateInput } from "~~/server/prisma/generated/prisma/models/Guest";
import formidable from "formidable";
import { fileTypeFromFile } from "file-type";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { serverSupabaseServiceRole } from "#supabase/server";
import { resolveGuestName, resolveGuestQuantity } from "#shared/utils/guests";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

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
    const supabase = serverSupabaseServiceRole(event);
    let uploadedPath: string | undefined;

    const payload: GuestCreateInput = {
      name: resolveGuestName(data.name, data.type),
      type: data.type,
      quantity: resolveGuestQuantity(data.name, data.quantity),
      company: data.company || undefined,
      imageUrl: undefined,
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
      return prisma.guest.create({data: payload});
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
      } catch { /* empty */
      }
    }
  }
});
