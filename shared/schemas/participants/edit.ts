import * as v from "valibot";
import createSchema from "./create";

const editSchema = v.omit(createSchema, [
  "cautionAgreement",
  "codeOfConduct",
  "imageAgreement",
  "curriculumVitae",
  "turnstileToken",
]);

export default editSchema;
export type EditParticipantFormState = v.InferInput<typeof editSchema>;
export type EditParticipantSchema = v.InferOutput<typeof editSchema>;
