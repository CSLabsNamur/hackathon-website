import schema from "#shared/schemas/settings/update";
import * as v from "valibot";
import formidable from "formidable";
import { fileTypeFromFile } from "file-type";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { serverSupabaseServiceRole } from "#supabase/server";
import { ACCEPTED_EVENT_LOGO_EXTS, EVENT_ASSETS_BUCKET, MAX_EVENT_LOGO_SIZE } from "#shared/utils/settingsFiles";
import { sanitizeFilename } from "#shared/utils/fileUploads";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "settings.update");

  const [bodyRaw, files] = await formidable({
    allowEmptyFiles: false,
    keepExtensions: true,
    maxFiles: 1,
    maxFileSize: MAX_EVENT_LOGO_SIZE,
    multiples: false,
  }).parse(event.node.req);

  const logoFile = files.logoFile?.[0];

  try {
    const settingsRaw = Array.isArray(bodyRaw?.settings) ? bodyRaw.settings[0] : bodyRaw?.settings;
    if (!settingsRaw || typeof settingsRaw !== "string") {
      throw createError({statusCode: 400, statusMessage: "Les paramètres sont requis."});
    }

    let settingsJson: unknown;
    try {
      settingsJson = JSON.parse(settingsRaw);
    } catch {
      throw createError({statusCode: 400, statusMessage: "Les paramètres sont invalides."});
    }

    const data = v.parse(schema, settingsJson);
    const currentSettings = await getEditableSettings();

    const supabase = serverSupabaseServiceRole(event);
    let uploadedPath: string | undefined;
    if (logoFile) {
      const detected = await fileTypeFromFile(logoFile.filepath);
      if (!detected || !ACCEPTED_EVENT_LOGO_EXTS.includes(detected.ext as typeof ACCEPTED_EVENT_LOGO_EXTS[number])) {
        throw createError({statusCode: 400, statusMessage: "Le logo doit être une image PNG, JPG ou WEBP."});
      }

      const scanner = await clamscan;
      if (scanner) {
        const scan = await scanner.scanFile(logoFile.filepath);
        if (scan.isInfected) {
          throw createError({statusCode: 400, statusMessage: "Le logo est infecté par un virus."});
        }
      } else {
        console.warn("[settings] ClamAV unavailable; skipping virus scan.");
      }

      const originalName = logoFile.originalFilename || `event-logo.${detected.ext}`;
      const storagePath = `logos/${randomUUID()}_${sanitizeFilename(originalName)}`;

      const {data: uploadData, error} = await supabase.storage
        .from(EVENT_ASSETS_BUCKET)
        .upload(storagePath, fs.createReadStream(logoFile.filepath), {
          contentType: detected.mime,
        });

      if (error || !uploadData) {
        throw createError({statusCode: 500, statusMessage: "Erreur lors du téléversement du logo."});
      }

      uploadedPath = uploadData.path;
      data.event.logoPath = uploadedPath;
    }

    try {
      const updatedSettings = await updateSettings(data);

      if (uploadedPath && currentSettings.event.logoPath) {
        const {error} = await supabase.storage.from(EVENT_ASSETS_BUCKET).remove([currentSettings.event.logoPath]);
        if (error) {
          console.error("Erreur lors de la suppression de l'ancien logo :", error);
        }
      }

      return updatedSettings;
    } catch (error) {
      if (uploadedPath) {
        await supabase.storage.from(EVENT_ASSETS_BUCKET).remove([uploadedPath]);
      }
      throw error;
    }
  } finally {
    if (logoFile) {
      try {
        fs.unlinkSync(logoFile.filepath);
      } catch (error) {
        console.warn("[settings] Failed to remove temporary logo file.", error);
      }
    }
  }
});
