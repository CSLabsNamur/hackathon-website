import type { EventRolloverInput } from "../../shared/schemas/settings/rollover";

export const currentEdition = {
  editionId: "wx08k2kzxcq6j8javrn4suy7",
  title: "Hackathon 2026",
  startDate: "2026-03-27T09:00:00Z",
  endDate: "2026-03-29T16:00:00Z",
  registrationsStartDate: "2025-11-01T00:00:00Z",
  registrationsEndDate: "2026-02-27T23:00:00Z",
};

export const nextEdition: EventRolloverInput = {
  editionId: currentEdition.editionId,
  revision: "a".repeat(64),
  confirmation: currentEdition.title,
  title: "Hackathon 2099",
  slogan: "Créons demain ensemble",
  startDate: "2099-10-23T10:00",
  endDate: "2099-10-25T18:00",
  registrationsStartDate: "2099-01-01T10:00",
  registrationsEndDate: "2099-10-01T18:00",
  reviewedArchive: true,
};
