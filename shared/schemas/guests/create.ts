import * as v from "valibot";
import { GuestType } from "~~/server/prisma/generated/prisma/enums";

const schema = v.strictObject({
  name: v.pipe(
    v.string(),
    v.nonEmpty("Le nom est requis"),
    v.maxLength(100, "Le nom ne peut pas dépasser 100 caractères"),
  ),
  type: v.enum(GuestType),
  company: v.optional(v.pipe(v.string(), v.maxLength(100, "Le nom de l'entreprise ne peut pas dépasser 100 caractères"))),
  imageUrl: v.optional(v.pipe(v.string(), v.maxLength(500, "L'URL de l'image ne peut pas dépasser 500 caractères"))),
});

export default schema;
export type CreateGuestSchema = v.InferOutput<typeof schema>;
