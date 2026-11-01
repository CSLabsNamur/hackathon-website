import * as v from "valibot";

export const badgeSelectionSchema = v.strictObject({
  ids: v.pipe(
    v.array(v.pipe(v.string(), v.cuid2("Identifiant invalide."))),
    v.minLength(1, "Sélectionnez au moins un élément."),
    v.maxLength(500, "Sélectionnez au maximum 500 éléments."),
    v.transform((ids) => [...new Set(ids)]),
  ),
});
