import { CautionStatus, GuestType, type Prisma, SubmissionType } from "~~/server/prisma/generated/prisma/browser";
import type { SerializeObject } from "nitropack";

// Exports every Prisma type for general use in the app with Nuxt's auto-imports
export { SubmissionType, CautionStatus, GuestType } from "../../server/prisma/generated/prisma/browser";

// Custom types, for additional relationships or specific use
// TODO: Huge problem: These types are not updated automatically when the Prisma schema changes. Need to refactor to use global includes.
export type Team = SerializeObject<Prisma.TeamGetPayload<{
  include: { members: { include: { user: true } }, room: true }
}>>;
export type TeamWithoutRelations = Omit<Team, "members" | "room">;
export type Participant = SerializeObject<Prisma.ParticipantGetPayload<{
  include: {
    team: {
      include: {
        members: {
          include: { user: true, submissions: { include: { request: true }, select: { id: true, requestId: true } } }
        }
      }
    },
    submissions: { include: { request: true, files: true } },
    user: true
  }
}>>;
export type ParticipantWithUser = Prisma.ParticipantGetPayload<{ include: { user: true } }>
export type ParticipantWithoutRelations = Omit<Participant, "team" | "submissions">;
export type Admin = SerializeObject<Prisma.AdminGetPayload<{
  include: {
    user: {
      include: {
        roleAssignments: {
          include: {
            role: true,
          },
        },
      },
    },
  },
}>>;
export type Guest = SerializeObject<Prisma.GuestGetPayload<object>>;
export type Sponsor = SerializeObject<Prisma.SponsorGetPayload<object>>;
export type Room = SerializeObject<Prisma.RoomGetPayload<{ include: { teams: true } }>>;
export type Submission = SerializeObject<Prisma.SubmissionGetPayload<{
  include: { participant: true, request: true, files: true }
}>>;
export type SubmissionRequest = SerializeObject<Prisma.SubmissionRequestGetPayload<{
  include: { submissions: true }
}>>;
export type ScheduleItem = SerializeObject<Prisma.ScheduleItemGetPayload<object>>;
export type Schedule = ScheduleItem[];
type RoleTemp = SerializeObject<Prisma.RoleGetPayload<{
  include: {
    permissions: { include: { permission: true } },
    _count: { select: { assignments: true, }, }
  }
}>>;
type RolePermission = RoleTemp["permissions"][number]["permission"];
export type Role = Omit<RoleTemp, "permissions"> & { permissions: RolePermission[] }; // Flatten permissions for easier use
export type PermissionDb = SerializeObject<Prisma.PermissionGetPayload<object>>; // "Permission" is already used for the typescript catalog, so we rename it here to avoid confusion

export const cautionStatusTranslateMap: Record<CautionStatus, string> = {
  [CautionStatus.NOT_PAID]: "Non payé",
  [CautionStatus.PAID]: "Payé",
  [CautionStatus.REFUNDED]: "Remboursé",
  [CautionStatus.WAIVED]: "Exonéré",
};

export const submissionTypeTranslateMap: Record<SubmissionType, string> = {
  [SubmissionType.TEXT]: "Texte",
  [SubmissionType.FILE]: "Fichier",
};

export const translateGuestType = (type: GuestType) => {
  switch (type) {
    case GuestType.SPEAKER:
      return "Conférencier";
    case GuestType.JURY:
      return "Jury";
    case GuestType.COACH:
      return "Coach";
    case GuestType.PHOTOGRAPHER:
      return "Photographe";
    case GuestType.GUEST:
      return "Invité";
    case GuestType.OTHER:
      return "Autre";
    default:
      return "Inconnu";
  }
};
