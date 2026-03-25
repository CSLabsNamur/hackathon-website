import * as v from "valibot";
import { GuestType } from "~~/server/prisma/generated/prisma/enums";

export const guestBodySchema = v.strictObject({
  name: v.pipe(
    v.string(),
    v.trim(),
    v.maxLength(100, "Le nom ne peut pas dépasser 100 caractères"),
  ),
  type: v.enum(GuestType),
  quantity: v.optional(v.pipe(
    v.union([v.string(), v.number()]),
    v.toNumber(),
    v.number("Le nombre de badges doit être un nombre."),
    v.minValue(1, "Le nombre de badges doit être d'au moins 1."),
  )),
  company: v.optional(v.pipe(
    v.string(),
    v.trim(),
    v.maxLength(100, "Le nom de l'entreprise ne peut pas dépasser 100 caractères"),
  )),
});

export const guestImageFileSchema = v.pipe(
  v.file(),
  v.mimeType([...ACCEPTED_GUEST_IMAGE_MIME_TYPES], `Veuillez sélectionner une image ${acceptedFormatsToLabel(ACCEPTED_GUEST_IMAGE_EXTS)!.toUpperCase()}.`),
  v.maxSize(MAX_GUEST_IMAGE_SIZE, "L'image est trop volumineuse (max 5MB)."),
);

const schema = v.strictObject({
  ...guestBodySchema.entries,
  imageFile: v.optional(guestImageFileSchema),
});

export default schema;
export type CreateGuestSchema = v.InferOutput<typeof schema>;
