import * as v from "valibot";

const schema = v.pipe(
  v.string(),
  v.cuid2("The ID is badly formatted"),
  v.length(30, "The ID must be 30 characters long"),
);

export default schema;
export type IdParam = v.InferOutput<typeof schema>;
