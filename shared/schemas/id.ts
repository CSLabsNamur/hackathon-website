import * as v from "valibot";

const schema = v.object({
  id: v.pipe(v.string(), v.cuid2("The ID is badly formatted")),
});

export default schema;
export type IdParam = v.InferOutput<typeof schema>;
