import * as v from "valibot";

const dateTime = v.pipe(v.string(), v.isoDateTime("Saisissez une date et une heure valides."));

const schema = v.pipe(
  v.strictObject({
    editionId: v.pipe(v.string(), v.cuid2()),
    revision: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)),
    confirmation: v.pipe(v.string(), v.nonEmpty("Recopiez le titre de l'événement actuel.")),
    title: v.pipe(v.string(), v.trim(), v.nonEmpty("Le nouveau titre est requis."), v.maxLength(100)),
    slogan: v.pipe(v.string(), v.maxLength(160, "Le slogan ne peut pas dépasser 160 caractères.")),
    startDate: dateTime,
    endDate: dateTime,
    registrationsStartDate: dateTime,
    registrationsEndDate: dateTime,
    reviewedArchive: v.pipe(v.boolean(), v.check((value) => value, "Vérifiez le contenu de l'archive avant de continuer.")),
  }),
  v.forward(v.partialCheck([["startDate"], ["endDate"]], (input) => input.startDate < input.endDate,
    "La fin doit être après le début de l'événement."), ["endDate"]),
  v.forward(v.partialCheck([["registrationsStartDate"], ["registrationsEndDate"]], (input) => input.registrationsStartDate < input.registrationsEndDate,
    "La fermeture doit être après l'ouverture des inscriptions."), ["registrationsEndDate"]),
  v.forward(v.partialCheck([["registrationsEndDate"], ["startDate"]], (input) => input.registrationsEndDate <= input.startDate,
    "Les inscriptions doivent se terminer au plus tard au début de l'événement."), ["registrationsEndDate"]),
);

export default schema;
export type EventRolloverInput = v.InferOutput<typeof schema>;
