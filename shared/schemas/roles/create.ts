import * as v from "valibot";

export const roleBodySchema = v.strictObject({
  key: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty("La clé du rôle est requise."),
    v.slug(
      "La clé doit commencer par une lettre minuscule et ne contenir que des lettres minuscules, chiffres et underscores.",
    ),
    v.maxLength(50, "La clé du rôle ne peut pas dépasser 50 caractères."),
  ),
  name: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty("Le nom du rôle est requis."),
    v.maxLength(75, "Le nom du rôle ne peut pas dépasser 75 caractères."),
  ),
  description: v.optional(
    v.pipe(
      v.string(),
      v.trim(),
      v.maxLength(500, "La description ne peut pas dépasser 500 caractères."),
    ),
  ),
  permissionKeys: v.pipe(
    v.array(v.picklist(PERMISSIONS)),
    v.check(
      (permissionKeys) => new Set(permissionKeys).size === permissionKeys.length,
      "Un rôle ne peut pas contenir deux fois la même permission.",
    ),
  ),
});

const schema = roleBodySchema;

export default schema;
export type CreateRoleSchema = v.InferOutput<typeof schema>;
