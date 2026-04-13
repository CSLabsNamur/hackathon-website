import * as v from "valibot";

const schema = v.pipe(v.strictObject({
    title: v.pipe(
      v.string(),
      v.nonEmpty("Le nom est requis"),
      v.minLength(3, "Le nom doit contenir au moins 3 caractères"),
      v.maxLength(100, "Le nom ne peut pas dépasser 100 caractères"),
    ),
    description: v.pipe(v.string(), v.maxLength(250, "La description ne peut pas dépasser 250 caractères")),
    icon: v.optional(
      v.pipe(
        v.string(),
        v.maxLength(100, "Le nom de l'icône ne peut pas dépasser 100 caractères"),
      ),
    ),
    dateString: v.pipe(
      v.string(),
      v.minLength(3, "La chaîne de date doit contenir au moins 3 caractères"),
      v.maxLength(100, "La chaîne de date ne peut pas dépasser 100 caractères"),
    ),
    startTime: v.pipe(
      v.string(),
      v.nonEmpty("L'heure de début est requise."),
      v.isoDateTime("L'heure de début doit être une date et heure valide."),
    ),
    endTime: v.pipe(
      v.string(),
      v.nonEmpty("L'heure de fin est requise."),
      v.isoDateTime("L'heure de fin doit être une date et heure valide."),
    ),
    special: v.optional(v.boolean(), false),
  }),
  v.forward(
    v.partialCheck(
      [["startTime"], ["endTime"]],
      (input) => input.startTime < input.endTime,
      "L'heure de fin doit être postérieure à l'heure de début.",
    ),
    ["endTime"],
  ));

export default schema;
export type CreateScheduleItemInput = v.InferInput<typeof schema>;
export type CreateScheduleItemSchema = v.InferOutput<typeof schema>;
