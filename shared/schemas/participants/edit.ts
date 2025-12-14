import * as v from "valibot";
import schema from "./create";

const editSchema = v.omit(schema, [
  "cautionAgreement",
  "codeOfConduct",
  "curriculumVitae",
]);

export default editSchema;
export type EditParticipantSchema = v.InferOutput<typeof editSchema>;
