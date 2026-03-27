import * as v from "valibot";

const booleanQueryParamSchema = v.optional(v.pipe(
  v.union([
    v.boolean(),
    v.literal("true"),
    v.literal("false"),
  ]),
  v.transform((value) => value === true || value === "true"),
));

const schema = v.strictObject({
  participants: booleanQueryParamSchema,
  guests: booleanQueryParamSchema,
  sponsors: booleanQueryParamSchema,
  admins: booleanQueryParamSchema,
});

export default schema;
export type RenderBadgesQuerySchema = v.InferOutput<typeof schema>;
