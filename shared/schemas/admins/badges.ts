import * as v from "valibot";

export const adminBadgeSelectionSchema = v.strictObject({
  ids: v.pipe(
    v.array(v.pipe(v.string(), v.cuid2("Identifiant d'administrateur invalide."))),
    v.minLength(1, "Sélectionnez au moins un administrateur."),
    v.maxLength(500, "Sélectionnez au maximum 500 administrateurs."),
    v.transform((ids) => [...new Set(ids)]),
  ),
});
