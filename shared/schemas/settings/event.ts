import * as v from "valibot";

export const eventDetailsSchema = v.strictObject({
  title: v.pipe(v.string(), v.trim(), v.nonEmpty("Le titre de l'événement est requis."),
    v.maxLength(100, "Le titre de l'événement ne peut pas dépasser 100 caractères.")),
  slogan: v.pipe(v.string(), v.maxLength(160, "Le slogan ne peut pas dépasser 160 caractères.")),
  startDate: v.pipe(v.string(), v.nonEmpty("La date de début est requise."),
    v.isoDateTime("La date de début doit être une date et heure valide.")),
  endDate: v.pipe(v.string(), v.nonEmpty("La date de fin est requise."),
    v.isoDateTime("La date de fin doit être une date et heure valide.")),
  registrationsStartDate: v.pipe(v.string(), v.nonEmpty("La date d'ouverture des inscriptions est requise."),
    v.isoDateTime("La date d'ouverture des inscriptions doit être une date et heure valide.")),
  registrationsEndDate: v.pipe(v.string(), v.nonEmpty("La date de fermeture des inscriptions est requise."),
    v.isoDateTime("La date de fermeture des inscriptions doit être une date et heure valide.")),
});

type EventDetails = v.InferOutput<typeof eventDetailsSchema>;

export const eventDateCheck = [
  [["startDate"], ["endDate"]],
  (input: Pick<EventDetails, "startDate" | "endDate">) => new Date(input.startDate) < new Date(input.endDate),
  "La date de fin doit être après la date de début.",
] as const;

export const registrationDateCheck = [
  [["registrationsStartDate"], ["registrationsEndDate"]],
  (input: Pick<EventDetails, "registrationsStartDate" | "registrationsEndDate">) => new Date(input.registrationsStartDate) < new Date(input.registrationsEndDate),
  "La fermeture des inscriptions doit être après leur ouverture.",
] as const;
