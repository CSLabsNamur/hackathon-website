import * as v from "valibot";
import schema from "./create";

const editSchema = v.omit(schema, [
  "cautionAgreement",
  "codeOfConduct",
  "imageAgreement",
  "curriculumVitae",
  "turnstileToken",
]);

export default editSchema;
export type EditParticipantSchema = v.InferOutput<typeof editSchema>;
