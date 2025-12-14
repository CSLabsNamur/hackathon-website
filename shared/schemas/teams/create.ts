import * as v from "valibot";

const schema = v.object({
  name: v.pipe(v.string(), v.nonEmpty("Le nom de l'équipe est requis"), v.minLength(3, "Le nom de l'équipe doit contenir au moins 3 caractères"), v.maxLength(30, "Le nom de l'équipe ne peut pas dépasser 30 caractères")),
  description: v.pipe(v.string(), v.maxLength(250, "La description de l'équipe ne peut pas dépasser 250 caractères")),
  idea: v.optional(v.pipe(v.string(), v.maxLength(100, "L'idée de l'équipe ne peut pas dépasser 100 caractères"))),
});

export default schema;
export type CreateTeamSchema = v.InferType<typeof schema>;
