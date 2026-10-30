import * as v from "valibot";
import { eventDetailsSchema, eventDateCheck, registrationDateCheck } from "./event";

const schema = v.pipe(
  v.strictObject({
    editionId: v.pipe(v.string(), v.cuid2()),
    revision: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)),
    confirmation: v.pipe(v.string(), v.nonEmpty("Recopiez le titre de l'événement actuel.")),
    ...eventDetailsSchema.entries,
    reviewedArchive: v.pipe(v.boolean(), v.check((value) => value, "Vérifiez le contenu de l'archive avant de continuer.")),
  }),
  v.forward(v.partialCheck(...eventDateCheck), ["endDate"]),
  v.forward(v.partialCheck(...registrationDateCheck), ["registrationsEndDate"]),
  v.forward(v.partialCheck([["registrationsEndDate"], ["startDate"]], (input) => new Date(input.registrationsEndDate) <= new Date(input.startDate),
    "Les inscriptions doivent se terminer au plus tard au début de l'événement."), ["registrationsEndDate"]),
);

export default schema;
export type EventRolloverInput = v.InferOutput<typeof schema>;
