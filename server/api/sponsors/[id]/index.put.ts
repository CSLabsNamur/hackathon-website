import * as v from "valibot";
import idParamSchema from "#shared/schemas/id";
import { sponsorBodySchema } from "#shared/schemas/sponsors/create";
import type { SponsorUpdateInput } from "~~/server/prisma/generated/prisma/models/Sponsor";
import formidable from "formidable";
import { fileTypeFromFile } from "file-type";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

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
    const sponsor = await prisma.sponsor.findUnique({where: {id}});

    if (!sponsor) {
      throw createError({statusCode: 404, statusMessage: "Sponsor introuvable."});
    }

    const payload: SponsorUpdateInput = {
      name: data.name,
      description: data.description as SponsorUpdateInput["description"],
      logo: sponsor.logo,
      url: data.url,
      hasBadge: data.hasBadge,
    };

    const supabase = serverSupabaseServiceRole(event);
    let uploadedPath: string | undefined;

    if (logoFile) {
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

      const originalName = logoFile.originalFilename || `logo.${detected.ext}`;
      const storagePath = `${randomUUID()}_${sanitizeFilename(originalName)}`;

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
    }

    try {
      const updatedSponsor = await prisma.sponsor.update({where: {id}, data: payload});

      if (uploadedPath) {
        const {error} = await supabase.storage.from(SPONSORS_BUCKET).remove([sponsor.logo]);
        if (error) {
          console.error("Erreur lors de la suppression de l'ancien logo sponsor :", error);
        }
      }

      return updatedSponsor;
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
