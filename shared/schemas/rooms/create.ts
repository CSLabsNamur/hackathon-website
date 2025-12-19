import * as v from "valibot";

export default v.strictObject({
  name: v.pipe(v.string(), v.nonEmpty("Le nom de la salle est requis"), v.minLength(3, "Le nom de la salle doit contenir au moins 3 caractères"), v.maxLength(30, "Le nom de la salle ne peut pas dépasser 30 caractères")),
});
