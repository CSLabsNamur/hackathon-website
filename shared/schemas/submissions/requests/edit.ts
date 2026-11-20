import * as v from "valibot";
import { submissionRequestFormSchema } from "./create";

export function editSubmissionRequestSchema(eventDateStart: Date | string, eventDateEnd: Date | string) {
  const editableFields = v.omit(submissionRequestFormSchema(eventDateStart, eventDateEnd), ["type"]);
  return v.strictObject({
    ...editableFields.entries,
    expectedUpdatedAt: v.optional(v.pipe(v.string(), v.isoTimestamp())),
  });
}

export type EditSubmissionRequestSchema = v.InferOutput<ReturnType<typeof editSubmissionRequestSchema>>;
