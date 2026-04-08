import { CautionStatus, GuestType, type Prisma, SubmissionType } from "~~/server/prisma/generated/prisma/browser";
import type { SerializeObject } from "nitropack";
import type { Permission as PermissionKey } from "./authorization";

// Exports every Prisma type for general use in the app with Nuxt's auto-imports
export { SubmissionType, CautionStatus, GuestType, RegistrationMode, SocialLinkType } from "../../server/prisma/generated/prisma/browser";

// Custom DTO types for API responses.
type TeamMember = SerializeObject<Prisma.ParticipantGetPayload<{
  select: {
    id: true,
    caution: true,
    user: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    },
  },
}>>;
export type Team = SerializeObject<Prisma.TeamGetPayload<{
  include: { room: true }
}>> & {
  members: TeamMember[];
};
export type TeamWithoutRelations = Omit<Team, "members" | "room">;
export type DbUser = Prisma.UserGetPayload<{
  select: {
    id: true;
    supabaseAuthId: true;
    email: true;
    firstName: true;
    lastName: true;
    admin: {
      select: {
        id: true;
        userId: true;
      };
    };
    participant: {
      select: {
        id: true;
        userId: true;
      };
    };
    roleAssignments: {
      select: {
        role: {
          select: {
            key: true;
            permissions: {
              select: {
                permission: {
                  select: {
                    key: true;
                  };
                };
              };
            };
          };
        };
      };
    };
  };
}>;
type ParticipantScalar = SerializeObject<Prisma.ParticipantGetPayload<object>>;
type ParticipantUser = SerializeObject<Prisma.UserGetPayload<{
  select: {
    id: true;
    email: true;
    firstName: true;
    lastName: true;
  };
}>>;
type CurrentParticipantSubmission = SerializeObject<Prisma.SubmissionGetPayload<{
  include: {
    request: true;
    files: true;
  };
}>>;
type CurrentParticipantTeam = SerializeObject<Prisma.TeamGetPayload<{
  include: {
    members: {
      select: {
        id: true;
        githubAccount: true;
        linkedInAccount: true;
        school: true;
        caution: true;
        curriculumVitae: true;
        user: {
          select: {
            id: true;
            firstName: true;
            lastName: true;
          };
        };
        submissions: {
          select: {
            id: true;
            requestId: true;
          };
        };
      };
    };
  };
}>>;

export type CurrentParticipant = ParticipantScalar & {
  team: CurrentParticipantTeam | null;
  submissions: CurrentParticipantSubmission[];
  user: ParticipantUser;
} & AuthorizationInfo;
export type CurrentParticipantTeamMember = CurrentParticipantTeam["members"][number];

type AdminParticipantBase = SerializeObject<Prisma.ParticipantGetPayload<{
  select: {
    id: true;
    userId: true;
    githubAccount: true;
    linkedInAccount: true;
    school: true;
    caution: true;
    teamId: true;
    curriculumVitae: true;
    createdAt: true;
    updatedAt: true;
    team: {
      select: {
        id: true;
        name: true;
        members: {
          select: {
            id: true;
            caution: true;
            user: {
              select: {
                id: true;
                firstName: true;
                lastName: true;
              };
            };
          };
        };
      };
    };
    user: {
      select: {
        id: true;
        email: true;
        firstName: true;
        lastName: true;
      };
    };
  };
}>>;
export type AdminParticipant = AdminParticipantBase & {
  diet: string | null;
  needs: string | null;
  imageAgreement: boolean | null;
  newsletter: boolean | null;
};

export type ParticipantWithUser = Prisma.ParticipantGetPayload<{ include: { user: true } }>
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

export type AuthorizationInfo = {
  authorization: {
    roleKeys: string[];
    permissionKeys: PermissionKey[];
  };
};
export type CurrentAdmin = Admin & AuthorizationInfo;
export type CurrentAuthorizedUser = CurrentAdmin | CurrentParticipant;
export type CurrentUser = {
  kind: "admin" | "participant";
  user: Prisma.UserGetPayload<{
    select: {
      id: true;
      email: true;
      firstName: true;
      lastName: true;
    }
  }>;
} & AuthorizationInfo;

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

// Utility type to replace specific fields in a type with string, useful for form handling where we want to allow empty strings instead of null/undefined.
export type WithStringFields<T, K extends keyof T> = Omit<T, K> & Record<K, string>;
