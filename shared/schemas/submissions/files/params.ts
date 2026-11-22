import * as v from "valibot";
import idSchema from "#shared/schemas/id";

export const submissionFileParamsSchema = v.object({
  id: idSchema.entries.id,
  fileId: idSchema.entries.id,
});
