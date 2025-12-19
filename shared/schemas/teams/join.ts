import * as v from "valibot";

const schema = v.strictObject({
  token: v.pipe(v.string(), v.nonEmpty("Le token est requis"), v.minLength(12, "Le token doit contenir au moins 12 caractères")),
});

export default schema;
export type JoinTeamSchema = v.InferOutput<typeof schema>;
