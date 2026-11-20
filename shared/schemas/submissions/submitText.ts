import * as v from "valibot";
import idSchema from "../id";

const schema = v.pipe(
  v.strictObject({
    skipped: v.optional(v.pipe(v.union([v.boolean(), v.literal("true"), v.literal("false")]), v.transform((x) => x === true || x === "true"))),
    content: v.optional(v.pipe(v.string(), v.trim(), v.nonEmpty("La réponse ne peut pas être vide."))),
    expectedUpdatedAt: v.optional(v.nullable(v.pipe(v.string(), v.isoTimestamp()))),
    expectedTeamId: v.optional(v.nullable(idSchema.entries.id)),
  }),
  v.forward(v.check((data) => Boolean(data.skipped || data.content), "Saisissez une réponse ou choisissez de ne pas remettre."), ["content"]),
);

export default schema;
export type SubmitTextSchema = v.InferOutput<typeof schema>;
