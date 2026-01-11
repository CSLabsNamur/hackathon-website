import * as v from "valibot";

const schema = v.strictObject({
  skipped: v.optional(v.pipe(v.union([v.boolean(), v.literal("true"), v.literal("false")]), v.transform((x) => x === true || x === "true"))),
  content: v.optional(v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty("La réponse ne peut pas être vide."),
  )),
});

export default schema;
export type SubmitTextSchema = v.InferOutput<typeof schema>;
