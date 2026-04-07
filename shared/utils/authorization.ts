import type { AuthorizationInfo } from "./types";

export const PERMISSION_CATALOG = [
  {key: "participants.read.own", group: "participants", name: "Lire son profil participant"},
  {key: "participants.update.own", group: "participants", name: "Modifier son profil participant"},
  {key: "participants.read", group: "participants", name: "Lire les participants"},
  {key: "participants.read.sensitive", group: "participants", name: "Lire les données sensibles des participants"},
  {key: "participants.check_in", group: "participants", name: "Enregistrer le check-in des participants"},
  {key: "participants.update", group: "participants", name: "Modifier les participants"},
  {key: "participants.update.caution", group: "participants", name: "Modifier les cautions des participants"},
  {
    key: "participants.update.sensitive",
    group: "participants",
    name: "Modifier les données sensibles des participants",
  },
  {key: "participants.delete", group: "participants", name: "Supprimer des participants"},
  {key: "participants.export", group: "participants", name: "Exporter les participants"},
  {
    key: "participants.export.sensitive",
    group: "participants",
    name: "Exporter les données sensibles des participants",
  },
  {key: "teams.read.own", group: "teams", name: "Lire sa propre équipe"},
  {key: "teams.create.own", group: "teams", name: "Créer sa propre équipe"},
  {key: "teams.update.own", group: "teams", name: "Modifier sa propre équipe"},
  {key: "teams.join", group: "teams", name: "Rejoindre une équipe"},
  {key: "teams.read", group: "teams", name: "Lire les équipes"},
  {key: "teams.update", group: "teams", name: "Modifier les équipes"},
  {key: "teams.delete", group: "teams", name: "Supprimer des équipes"},
  {key: "teams.export", group: "teams", name: "Exporter les équipes"},
  {key: "submissions.read.own", group: "submissions", name: "Lire ses propres soumissions"},
  {key: "submissions.update.own", group: "submissions", name: "Modifier ses propres soumissions"},
  {key: "submissions.delete.own", group: "submissions", name: "Supprimer ses propres soumissions"},
  {key: "guests.read", group: "guests", name: "Lire les invités"},
  {key: "guests.create", group: "guests", name: "Créer des invités"},
  {key: "guests.update", group: "guests", name: "Modifier les invités"},
  {key: "guests.delete", group: "guests", name: "Supprimer des invités"},
  {key: "guests.export", group: "guests", name: "Exporter les invités"},
  {key: "sponsors.read", group: "sponsors", name: "Lire les sponsors"},
  {key: "sponsors.create", group: "sponsors", name: "Créer des sponsors"},
  {key: "sponsors.update", group: "sponsors", name: "Modifier les sponsors"},
  {key: "sponsors.delete", group: "sponsors", name: "Supprimer des sponsors"},
  {key: "sponsors.export", group: "sponsors", name: "Exporter les sponsors"},
  {key: "broadcasts.send", group: "broadcasts", name: "Envoyer des diffusions"},
  {key: "submissionRequests.read", group: "submissionRequests", name: "Lire les demandes de soumission"},
  {key: "submissionRequests.create", group: "submissionRequests", name: "Créer des demandes de soumission"},
  {key: "submissionRequests.update", group: "submissionRequests", name: "Modifier les demandes de soumission"},
  {key: "submissionRequests.delete", group: "submissionRequests", name: "Supprimer des demandes de soumission"},
  {key: "submissionRequests.export", group: "submissionRequests", name: "Exporter les demandes de soumission"},
  {key: "rooms.read", group: "rooms", name: "Lire les salles"},
  {key: "rooms.create", group: "rooms", name: "Créer des salles"},
  {key: "rooms.update", group: "rooms", name: "Modifier les salles"},
  {key: "rooms.assign.team", group: "rooms", name: "Assigner des équipes aux salles"},
  {key: "rooms.delete", group: "rooms", name: "Supprimer des salles"},
  {key: "rooms.export", group: "rooms", name: "Exporter les salles"},
  {key: "schedule.create", group: "schedule", name: "Créer des éléments de planning"},
  {key: "schedule.update", group: "schedule", name: "Modifier le planning"},
  {key: "schedule.delete", group: "schedule", name: "Supprimer des éléments de planning"},
  {key: "badges.print", group: "badges", name: "Imprimer des badges"},
  {key: "admins.read", group: "admins", name: "Lire les administrateurs"},
  {key: "admins.create", group: "admins", name: "Créer des administrateurs"},
  {key: "admins.update", group: "admins", name: "Modifier les administrateurs"},
  {key: "admins.delete", group: "admins", name: "Supprimer des administrateurs"},
  {key: "roles.read", group: "roles", name: "Lire les rôles"},
  {key: "roles.create", group: "roles", name: "Créer des rôles"},
  {key: "roles.update", group: "roles", name: "Modifier les rôles"},
  {key: "roles.delete", group: "roles", name: "Supprimer des rôles"},
] as const;

export type Permission = typeof PERMISSION_CATALOG[number]["key"];

export const PERMISSIONS: readonly Permission[] = PERMISSION_CATALOG.map((permission) => permission.key);

type AuthorizationContext = AuthorizationInfo["authorization"];

export function getNonDelegablePermissionKeys(authorization: AuthorizationContext | null | undefined, permissionKeys: Iterable<string>) {
  if (authorization?.roleKeys.includes("super_admin")) return [];

  const grantedPermissionKeys = new Set<string>(authorization?.permissionKeys ?? []);
  const requestedPermissionKeys = new Set(permissionKeys);

  return [...requestedPermissionKeys].filter((permissionKey) => !grantedPermissionKeys.has(permissionKey));
}
