import * as v from "valibot";

export default v.strictObject({
  skipped: v.optional(v.boolean(), false),
  content: v.string(), // TODO: File-based submissions
});
