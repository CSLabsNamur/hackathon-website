import type { Permission } from "./authorization";

// Catalog types for CASL, to update when adding new permissions or DB models.
export type AppAction =
  | "read"
  | "readOwn"
  | "readSensitive"
  | "checkIn"
  | "create"
  | "createOwn"
  | "update"
  | "updateCaution"
  | "updateOwn"
  | "updateSensitive"
  | "delete"
  | "deleteOwn"
  | "export"
  | "exportSensitive"
  | "send"
  | "assign"
  | "join"
  | "print";

export type AppSubjectName =
  | "all"
  | "Admin"
  | "Badge"
  | "Broadcast"
  | "Guest"
  | "Participant"
  | "Permission"
  | "Role"
  | "Room"
  | "ScheduleItem"
  | "Settings"
  | "Sponsor"
  | "Submission"
  | "SubmissionFile"
  | "SubmissionRequest"
  | "Team"
  | "User";

export type PermissionRule = {
  action: AppAction;
  subject: AppSubjectName;
};

// TODO: Replace unknown with actual conditions type when we have permissions with conditions
type AbilityCan = (action: AppAction, subject: AppSubjectName, conditions?: unknown) => unknown;

type PermissionDefinitionContext = {
  can: AbilityCan;
};

type PermissionDefinition = PermissionRule & {
  apply: (context: PermissionDefinitionContext) => void;
};

const definePermission = (rule: PermissionRule): PermissionDefinition => ({
  ...rule,
  apply: ({can}) => can(rule.action, rule.subject),
});

export const PERMISSION_DEFINITIONS = {
  "participants.read.own": definePermission({action: "readOwn", subject: "Participant"}),
  "participants.update.own": definePermission({action: "updateOwn", subject: "Participant"}),
  "participants.read": definePermission({action: "read", subject: "Participant"}),
  "participants.read.sensitive": definePermission({action: "readSensitive", subject: "Participant"}),
  "participants.check_in": definePermission({action: "checkIn", subject: "Participant"}),
  "participants.update": definePermission({action: "update", subject: "Participant"}),
  "participants.update.caution": definePermission({action: "updateCaution", subject: "Participant"}),
  "participants.update.sensitive": definePermission({action: "updateSensitive", subject: "Participant"}),
  "participants.delete": definePermission({action: "delete", subject: "Participant"}),
  "participants.export": definePermission({action: "export", subject: "Participant"}),
  "participants.export.sensitive": definePermission({action: "exportSensitive", subject: "Participant"}),
  "teams.read.own": definePermission({action: "readOwn", subject: "Team"}),
  "teams.create.own": definePermission({action: "createOwn", subject: "Team"}),
  "teams.update.own": definePermission({action: "updateOwn", subject: "Team"}),
  "teams.join": definePermission({action: "join", subject: "Team"}),
  "teams.read": definePermission({action: "read", subject: "Team"}),
  "teams.update": definePermission({action: "update", subject: "Team"}),
  "teams.delete": definePermission({action: "delete", subject: "Team"}),
  "teams.export": definePermission({action: "export", subject: "Team"}),
  "submissions.read.own": definePermission({action: "readOwn", subject: "Submission"}),
  "submissions.update.own": definePermission({action: "updateOwn", subject: "Submission"}),
  "submissions.delete.own": definePermission({action: "deleteOwn", subject: "Submission"}),
  "guests.read": definePermission({action: "read", subject: "Guest"}),
  "guests.create": definePermission({action: "create", subject: "Guest"}),
  "guests.update": definePermission({action: "update", subject: "Guest"}),
  "guests.delete": definePermission({action: "delete", subject: "Guest"}),
  "guests.export": definePermission({action: "export", subject: "Guest"}),
  "sponsors.read": definePermission({action: "read", subject: "Sponsor"}),
  "sponsors.create": definePermission({action: "create", subject: "Sponsor"}),
  "sponsors.update": definePermission({action: "update", subject: "Sponsor"}),
  "sponsors.delete": definePermission({action: "delete", subject: "Sponsor"}),
  "sponsors.export": definePermission({action: "export", subject: "Sponsor"}),
  "broadcasts.send": definePermission({action: "send", subject: "Broadcast"}),
  "submissionRequests.read": definePermission({action: "read", subject: "SubmissionRequest"}),
  "submissionRequests.create": definePermission({action: "create", subject: "SubmissionRequest"}),
  "submissionRequests.update": definePermission({action: "update", subject: "SubmissionRequest"}),
  "submissionRequests.delete": definePermission({action: "delete", subject: "SubmissionRequest"}),
  "submissionRequests.export": definePermission({action: "export", subject: "SubmissionRequest"}),
  "rooms.read": definePermission({action: "read", subject: "Room"}),
  "rooms.create": definePermission({action: "create", subject: "Room"}),
  "rooms.update": definePermission({action: "update", subject: "Room"}),
  "rooms.assign.team": definePermission({action: "assign", subject: "Room"}),
  "rooms.delete": definePermission({action: "delete", subject: "Room"}),
  "rooms.export": definePermission({action: "export", subject: "Room"}),
  "schedule.update": definePermission({action: "update", subject: "ScheduleItem"}),
  "badges.print": definePermission({action: "print", subject: "Badge"}),
  "admins.read": definePermission({action: "read", subject: "Admin"}),
  "admins.create": definePermission({action: "create", subject: "Admin"}),
  "admins.update": definePermission({action: "update", subject: "Admin"}),
  "admins.delete": definePermission({action: "delete", subject: "Admin"}),
  "roles.read": definePermission({action: "read", subject: "Role"}),
  "roles.create": definePermission({action: "create", subject: "Role"}),
  "roles.update": definePermission({action: "update", subject: "Role"}),
  "roles.delete": definePermission({action: "delete", subject: "Role"}),
  "settings.read": definePermission({action: "read", subject: "Settings"}),
  "settings.update": definePermission({action: "update", subject: "Settings"}),
} satisfies Record<Permission, PermissionDefinition>;

export function getPermissionDefinition(permission: Permission): PermissionDefinition {
  return PERMISSION_DEFINITIONS[permission];
}

export function getPermissionRule(permission: Permission): PermissionRule {
  const {action, subject} = getPermissionDefinition(permission);
  return {action, subject};
}

export function applyPermissionDefinition(permission: Permission, can: AbilityCan) {
  getPermissionDefinition(permission).apply({can});
}
