import * as v from "valibot";
import idSchema from "../id";
import { MAX_SUBMISSION_FILES, MAX_SUBMISSION_UPLOAD_SIZE, normalizeAcceptedFormats } from "../../utils/fileUploads";

/**
 * Upload schema used for FILE submission requests.
 *
 * Notes:
 * - The API route parses multipart data with formidable, so `files` never exists in the parsed body
 *   (it lives in formidable's separate `files` output).
 * - On the client, this schema is used to validate the UForm state.
 */
export const createUploadSchema = (acceptedFormats?: string[] | null, multiple = true) => {
  const allowedExts = normalizeAcceptedFormats(acceptedFormats);
  const fileSchema = v.pipe(
    v.file(),
    v.maxSize(MAX_SUBMISSION_UPLOAD_SIZE, "Le fichier est trop volumineux (5 Mo maximum)."),
    v.check((file) => !allowedExts.length || allowedExts.includes(file.name.split(".").pop()?.toLowerCase() ?? ""),
      `Formats acceptés : ${allowedExts.join(", ")}.`),
  );

  return v.strictObject({
    skipped: v.optional(
      v.pipe(
        v.union([v.boolean(), v.literal("true"), v.literal("false")]),
        v.transform((x) => x === true || x === "true"),
      ),
    ),
    expectedUpdatedAt: v.optional(v.nullable(v.pipe(v.string(), v.isoTimestamp()))),
    expectedTeamId: v.optional(v.nullable(idSchema.entries.id)),
    files: v.optional(
      v.pipe(
        v.array(fileSchema),
        v.minLength(1, "Sélectionnez au moins un fichier."),
        v.maxLength(multiple ? MAX_SUBMISSION_FILES : 1, multiple ? `Maximum ${MAX_SUBMISSION_FILES} fichiers par envoi.` : "Un seul fichier est autorisé."),
        v.check((files) => files.reduce((size, file) => size + file.size, 0) <= MAX_SUBMISSION_UPLOAD_SIZE, "L'envoi ne peut pas dépasser 5 Mo au total."),
      ),
    ),
  });
};

export default createUploadSchema;
export type UploadSchema = v.InferOutput<ReturnType<typeof createUploadSchema>>;
