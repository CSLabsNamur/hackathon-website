import * as v from "valibot";

export default v.strictObject({
  title: v.pipe(v.string(), v.nonEmpty("Le nom est requis"), v.minLength(3, "Le nom doit contenir au moins 3 caractères"), v.maxLength(30, "Le nom ne peut pas dépasser 30 caractères")),
  description: v.pipe(v.string(), v.maxLength(250, "La description ne peut pas dépasser 250 caractères")),
  icon: v.optional(v.pipe(v.string(), v.maxLength(100, "Le nom de l'icône ne peut pas dépasser 100 caractères"))),
  dateString: v.pipe(v.string(), v.minLength(3, "La chaîne de date doit contenir au moins 3 caractères"), v.maxLength(50, "La chaîne de date ne peut pas dépasser 50 caractères")),
  startTime: v.pipe(v.date()),
  endTime: v.pipe(v.date()),
  special: v.optional(v.boolean(), false),
});
