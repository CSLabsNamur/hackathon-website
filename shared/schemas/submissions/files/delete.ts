import * as v from "valibot";
import idSchema from "#shared/schemas/id";

// TODO: Maybe move elsewhere?
export const deleteSubmissionFileParamsSchema = v.object({
  id: idSchema.entries.id,
  fileId: idSchema.entries.id,
});

export type DeleteSubmissionFileParamsSchema = v.InferOutput<typeof deleteSubmissionFileParamsSchema>;
