import * as v from "valibot";
import { sponsorBodySchema } from "#shared/schemas/sponsors/create";
import type { SponsorCreateInput } from "~~/server/prisma/generated/prisma/models/Sponsor";
import formidable from "formidable";
import { fileTypeFromFile } from "file-type";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "sponsors.create");

  const [bodyRaw, files] = await formidable({
    allowEmptyFiles: false,
    keepExtensions: true,
    maxFiles: 1,
    maxFileSize: MAX_SPONSOR_LOGO_SIZE,
    multiples: false,
  }).parse(event.node.req);

  const logoFile = files.logoFile?.[0];

  try {
    const bodyFlat = Object.fromEntries(Object.entries(bodyRaw ?? {}).map(([key, value]) => {
      if (Array.isArray(value)) return [key, value[0]];
      return [key, value];
    }));

    const data = v.parse(sponsorBodySchema, bodyFlat);

    if (!logoFile) {
      throw createError({statusCode: 400, statusMessage: "Le logo du sponsor est requis."});
    }

    const detected = await fileTypeFromFile(logoFile.filepath);
    if (!detected || !ACCEPTED_SPONSOR_LOGO_EXTS.includes(detected.ext as typeof ACCEPTED_SPONSOR_LOGO_EXTS[number])) {
      throw createError({statusCode: 400, statusMessage: "Le logo doit être une image PNG, JPG ou WEBP."});
    }

    const scanner = await clamscan;
    if (scanner) {
      const scan = await scanner.scanFile(logoFile.filepath);
      if (scan.isInfected) {
        throw createError({statusCode: 400, statusMessage: "Le logo est infecté par un virus."});
      }
    } else {
      console.warn("[sponsors] ClamAV unavailable; skipping virus scan.");
    }

    const supabase = serverSupabaseServiceRole(event);
    const originalName = logoFile.originalFilename || `logo.${detected.ext}`;
    const storagePath = `${randomUUID()}_${sanitizeFilename(originalName)}`;

    let uploadedPath: string | undefined;

    const payload: SponsorCreateInput = {
      name: data.name,
      description: data.description as SponsorCreateInput["description"],
      logo: "",
      url: data.url,
      hasBadge: data.hasBadge,
    };

    try {
      const {data: uploadData, error} = await supabase.storage
        .from(SPONSORS_BUCKET)
        .upload(storagePath, fs.createReadStream(logoFile.filepath), {
          contentType: detected.mime,
        });

      if (error || !uploadData) {
        throw createError({statusCode: 500, statusMessage: "Erreur lors du téléversement du logo."});
      }

      uploadedPath = uploadData.path;
      payload.logo = uploadData.path;

      return prisma.sponsor.create({data: payload});
    } catch (error) {
      if (uploadedPath) {
        await supabase.storage.from(SPONSORS_BUCKET).remove([uploadedPath]);
      }
      throw error;
    }
  } finally {
    if (logoFile) {
      try {
        fs.unlinkSync(logoFile.filepath);
      } catch { /* empty */
      }
    }
  }
});
