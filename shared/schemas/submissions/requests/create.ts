import * as v from "valibot";
import dayjs from "~~/server/utils/dayjs";

// We cannot call Nuxt composables (useDayjs, useRuntimeConfig) at module top level here
// because this file is used in both client and server contexts and is not a Nuxt setup/plugin.
// Instead, we define a factory that receives what it needs from the caller.

export const createSubmissionRequestSchema = (
  eventDateStart: string,
  eventDateEnd: string,
) => {
  const eventDateStartParsed = dayjs(eventDateStart);
  const eventDateEndParsed = dayjs(eventDateEnd);

  return v.strictObject({
    // Type differs from the one in the database, because of UI/UX reasons. I just found it just more intuitive to select one
    // of "text", "file" or "files" in the frontend rather than asking to check a "multiple" checkbox when "file" is selected.
    type: v.picklist(["text", "file", "files"]),
    title: v.pipe(
      v.string(),
      v.nonEmpty("Le titre ne peut pas être vide"),
      v.minWords("fr", 1, "Le titre doit contenir au moins 1 mot"),
      v.maxLength(50, "Le titre est trop long (max 50 caractères)"),
    ),
    description: v.optional(
      v.pipe(
        v.string(),
        v.minWords("fr", 3, "La description, si elle existe, doit au moins contenir 3 mots."),
        v.maxLength(150, "La description est trop longue (max 150 caractères)"),
      ),
    ),
    deadline: v.pipe(
      v.string(),
      v.isoDateTime(),
      v.check((input) => {
        const date = dayjs(input);
        return date.isBetween(eventDateStartParsed, eventDateEndParsed);
      }, "La date doit être entre le début et la fin de l'événement."),
    ),
    acceptedFormats: v.optional(v.string()),
    required: v.optional(v.boolean()),
  });
};

const _tempSchema = v.strictObject({
  // Type differs from the one in the database, because of UI/UX reasons. I just found it just more intuitive to select one
  // of "text", "file" or "files" in the frontend rather than asking to check a "multiple" checkbox when "file" is selected.
  type: v.picklist(["text", "file", "files"]),
  title: v.pipe(
    v.string(),
    v.nonEmpty(),
    v.minWords("fr", 1),
    v.maxLength(50),
  ),
  description: v.optional(
    v.pipe(
      v.string(),
      v.minWords("fr", 3),
      v.maxLength(150),
    ),
  ),
  deadline: v.pipe(
    v.string(),
    v.isoDateTime(),
  ),
  acceptedFormats: v.optional(v.string()),
  required: v.optional(v.boolean()),
});
export type CreateSubmissionRequestSchema = v.InferOutput<typeof _tempSchema>;
