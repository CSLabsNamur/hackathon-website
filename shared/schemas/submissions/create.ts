import * as v from "valibot";

export default v.object({
  content: props.submission.type === "text" ? v.string() : props.submission.multiple ? v.optional(v.array(v.file())) : v.optional(v.file()),
});
