import * as v from "valibot";

/**
 * Upload schema used for FILE submission requests.
 *
 * Notes:
 * - The API route parses multipart data with formidable, so `files` never exists in the parsed body
 *   (it lives in formidable's separate `files` output).
 * - On the client, this schema is used to validate the UForm state.
 */
export const createUploadSchema = (acceptedFormats?: string[] | null) => {
  const allowedExts = (acceptedFormats ?? []).map((e) => String(e).toLowerCase());

  const errType = allowedExts.length
    ? `Veuillez sélectionner un fichier au format: ${allowedExts.join(", ")}.`
    : "Veuillez sélectionner un fichier valide.";

  const fileSchema = v.pipe(
    v.file(),
    v.maxSize(1024 * 1024 * 5, "Le fichier est trop volumineux (max 5MB)"),
    v.check((file) => {
      // If no constraints, accept anything
      if (!allowedExts.length) return true;

      const name = file.name || "";
      const ext = name.split(".").pop()?.toLowerCase() ?? "";
      return allowedExts.includes(ext);
    }, errType),
  );

  return v.strictObject({
    skipped: v.optional(
      v.pipe(
        v.union([v.boolean(), v.literal("true"), v.literal("false")]),
        v.transform((x) => x === true || x === "true"),
      ),
    ),
    files: v.optional(
      v.array(fileSchema, "Veuillez sélectionner au moins un fichier."),
    ),
  });
};

export default createUploadSchema;

const _schema = createUploadSchema();
export type UploadSchema = v.InferOutput<typeof _schema>;
