import { EventPhase } from "#shared/utils/types";

export function getParticipantArrivalAlert(eventPhase: EventPhase) {
  if (eventPhase === EventPhase.ONGOING) {
    return {
      color: "warning" as const,
      title: "Votre arrivée n'a pas encore été enregistrée",
      description: "Veuillez vous rendre à l'accueil pour enregistrer votre arrivée.",
    };
  }

  if (eventPhase === EventPhase.ENDED) {
    return {
      color: "error" as const,
      title: "Votre arrivée n'a pas été enregistrée. Votre caution ne sera pas remboursée.",
      description: "Contactez l'organisation si vous pensez qu'il s'agit d'une erreur.",
    };
  }

  return null;
}
