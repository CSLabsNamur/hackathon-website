import type { JSONContent } from "@tiptap/core";
import * as v from "valibot";

export const sponsorBodySchema = v.strictObject({
  name: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty("Le nom ne peut pas être vide."),
    v.maxLength(50, "Le nom ne peut pas dépasser 50 caractères."),
  ),
  description: v.pipe(
    v.looseObject({
      type: v.literal("doc"),
    }),
    v.check((input) => isRichTextDocument(input), "La description est invalide."),
    v.transform((input) => input as JSONContent),
  ),
  url: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty("L'URL ne peut pas être vide."),
    v.url("L'URL du site web est invalide."),
    v.maxLength(150, "L'URL ne peut pas dépasser 150 caractères."),
  ),
  hasBadge: v.pipe(
    v.union([v.boolean(), v.literal("true"), v.literal("false")]),
    v.transform((x) => x === true || x === "true"),
  ),
});

export const sponsorLogoFileSchema = v.pipe(
  v.file(),
  v.mimeType([...ACCEPTED_SPONSOR_LOGO_MIME_TYPES], "Veuillez sélectionner une image PNG, JPG ou WEBP."),
  v.maxSize(MAX_SPONSOR_LOGO_SIZE, "Le logo est trop volumineux (max 5MB)."),
);

const schema = v.strictObject({
  ...sponsorBodySchema.entries,
  logoFile: sponsorLogoFileSchema,
});

export default schema;
export type CreateSponsorSchema = v.InferOutput<typeof schema>;
