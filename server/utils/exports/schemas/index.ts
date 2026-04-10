import { CautionStatus } from "~~/server/prisma/generated/prisma/enums";
import type { Prisma } from "~~/server/prisma/generated/prisma/client";
import { normalizeRichTextDocument, richTextToPlainText } from "#shared/utils/richText";
import { cautionStatusTranslateMap, submissionTypeTranslateMap, translateGuestType } from "#shared/utils/types";
import type { PrismaRecord } from "../../prismaRecordPaths";
import type { ServerAdminExportSchema } from "../types";

const translateBoolean = (value?: boolean | null) => value ? "Oui" : "Non";
type ParticipantExportRow = Prisma.ParticipantGetPayload<{
  select: {
    caution: true;
    newsletter: true;
    imageAgreement: true;
  };
}>;

type TeamExportRow = Prisma.TeamGetPayload<{
  select: {
    members: {
      select: {
        id: true;
        caution: true;
        user: {
          select: {
            firstName: true;
            lastName: true;
          };
        };
      };
    };
  };
}>;

type GuestExportRow = Prisma.GuestGetPayload<{
  select: {
    type: true;
  };
}>;

type SponsorExportRow = Prisma.SponsorGetPayload<{
  select: {
    hasBadge: true;
    description: true;
  };
}>;

type SubmissionRequestExportRow = Prisma.SubmissionRequestGetPayload<{
  select: {
    type: true;
    required: true;
    acceptedFormats: true;
    multiple: true;
    submissions: {
      select: {
        id: true;
      };
    };
  };
}>;

type RoomExportRow = Prisma.RoomGetPayload<{
  select: {
    teams: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

const defineExportSchema = <Row extends PrismaRecord>(schema: ServerAdminExportSchema<Row>) => schema;

const participantsExportSchema = defineExportSchema<ParticipantExportRow>({
  resource: "participants",
  name: "Participants",
  fileBaseName: "participants",
  requiredPermissions: ["participants.read", "participants.export"],
  prismaDelegateKey: "participant",
  orderBy: {updatedAt: "desc"},
  columns: [
    {id: "id", name: "ID", enabledByDefault: false, path: "id"},
    {id: "firstName", name: "Prénom", path: "user.firstName"},
    {id: "lastName", name: "Nom", path: "user.lastName"},
    {id: "email", name: "Email", path: "user.email"},
    {
      id: "caution",
      name: "Caution",
      selectPaths: ["caution"],
      value: (row) => cautionStatusTranslateMap[row.caution] ?? row.caution,
    },
    {id: "team", name: "Équipe", path: "team.name"},
    {id: "school", name: "École", path: "school"},
    {id: "githubAccount", name: "GitHub", enabledByDefault: false, path: "githubAccount"},
    {id: "linkedInAccount", name: "LinkedIn", enabledByDefault: false, path: "linkedInAccount"},
    {id: "curriculumVitae", name: "CV", enabledByDefault: false, path: "curriculumVitae"},
    {
      id: "diet",
      name: "Régime alimentaire",
      enabledByDefault: false,
      path: "diet",
      requiredPermissions: ["participants.read.sensitive", "participants.export.sensitive"],
    },
    {
      id: "needs",
      name: "Besoins spéciaux",
      enabledByDefault: false,
      path: "needs",
      requiredPermissions: ["participants.read.sensitive", "participants.export.sensitive"],
    },
    {
      id: "newsletter",
      name: "Newsletter",
      enabledByDefault: false,
      selectPaths: ["newsletter"],
      value: (row) => translateBoolean(row.newsletter),
      requiredPermissions: ["participants.read.sensitive", "participants.export.sensitive"],
    },
    {
      id: "imageAgreement",
      name: "Droit à l'image",
      enabledByDefault: false,
      selectPaths: ["imageAgreement"],
      value: (row) => translateBoolean(row.imageAgreement),
      requiredPermissions: ["participants.read.sensitive", "participants.export.sensitive"],
    },
    {id: "createdAt", name: "Créé le", enabledByDefault: false, path: "createdAt"},
    {id: "updatedAt", name: "Mis à jour le", enabledByDefault: false, path: "updatedAt"},
  ],
});

const teamsExportSchema = defineExportSchema<TeamExportRow>({
  resource: "teams",
  name: "Équipes",
  fileBaseName: "teams",
  requiredPermissions: ["teams.read", "teams.export"],
  prismaDelegateKey: "team",
  orderBy: {updatedAt: "desc"},
  columns: [
    {id: "id", name: "ID", enabledByDefault: false, path: "id"},
    {id: "name", name: "Nom", path: "name"},
    {id: "description", name: "Description", path: "description"},
    {id: "idea", name: "Idée", path: "idea"},
    {
      id: "valid",
      name: "Validité",
      enabledByDefault: true,
      selectPaths: ["members.caution"],
      requiredPermissions: ["participants.read"],
      value: (row) => row.members.every((member) => member.caution !== CautionStatus.NOT_PAID) ? "Valide" : "Invalide",
    },
    {
      id: "membersCount",
      name: "Nombre de membres",
      enabledByDefault: true,
      selectPaths: ["members.id"],
      requiredPermissions: ["participants.read"],
      value: (row) => row.members.length,
    },
    {
      id: "memberNames",
      name: "Membres",
      enabledByDefault: false,
      selectPaths: ["members.user.firstName", "members.user.lastName"],
      requiredPermissions: ["participants.read"],
      value: (row) => row.members
        .map((member) => [member.user.firstName, member.user.lastName].filter(Boolean).join(" ").trim())
        .filter(Boolean)
        .join(", "),
    },
    {
      id: "room",
      name: "Salle",
      enabledByDefault: false,
      path: "room.name",
      requiredPermissions: ["rooms.read"],
    },
    {id: "token", name: "Token", enabledByDefault: false, path: "token"},
    {id: "createdAt", name: "Créé le", enabledByDefault: false, path: "createdAt"},
    {id: "updatedAt", name: "Mis à jour le", enabledByDefault: false, path: "updatedAt"},
  ],
});

const guestsExportSchema = defineExportSchema<GuestExportRow>({
  resource: "guests",
  name: "Invités",
  fileBaseName: "guests",
  requiredPermissions: ["guests.read", "guests.export"],
  prismaDelegateKey: "guest",
  orderBy: {name: "asc"},
  columns: [
    {id: "id", name: "ID", enabledByDefault: false, path: "id"},
    {id: "name", name: "Nom", path: "name"},
    {
      id: "type",
      name: "Type",
      selectPaths: ["type"],
      value: (row) => translateGuestType(row.type),
    },
    {id: "company", name: "Entreprise", path: "company"},
    {id: "quantity", name: "Nombre de badges", path: "quantity"},
    {id: "imageUrl", name: "Image", enabledByDefault: false, path: "imageUrl"},
    {id: "createdAt", name: "Créé le", enabledByDefault: false, path: "createdAt"},
    {id: "updatedAt", name: "Mis à jour le", enabledByDefault: false, path: "updatedAt"},
  ],
});

const sponsorsExportSchema = defineExportSchema<SponsorExportRow>({
  resource: "sponsors",
  name: "Sponsors",
  fileBaseName: "sponsors",
  requiredPermissions: ["sponsors.read", "sponsors.export"],
  prismaDelegateKey: "sponsor",
  orderBy: {name: "asc"},
  columns: [
    {id: "id", name: "ID", enabledByDefault: false, path: "id"},
    {id: "name", name: "Nom", path: "name"},
    {id: "url", name: "Site web", path: "url"},
    {
      id: "hasBadge",
      name: "Badge",
      selectPaths: ["hasBadge"],
      value: (row) => translateBoolean(row.hasBadge),
    },
    {
      id: "description",
      name: "Description",
      enabledByDefault: false,
      selectPaths: ["description"],
      value: (row) => richTextToPlainText(normalizeRichTextDocument(row.description)),
    },
    {id: "createdAt", name: "Créé le", enabledByDefault: false, path: "createdAt"},
    {id: "updatedAt", name: "Mis à jour le", enabledByDefault: false, path: "updatedAt"},
  ],
});

const submissionRequestsExportSchema = defineExportSchema<SubmissionRequestExportRow>({
  resource: "submissionRequests",
  name: "Demandes de soumission",
  fileBaseName: "submission-requests",
  requiredPermissions: ["submissionRequests.read", "submissionRequests.export"],
  prismaDelegateKey: "submissionRequest",
  orderBy: {updatedAt: "desc"},
  columns: [
    {id: "id", name: "ID", enabledByDefault: false, path: "id"},
    {id: "title", name: "Titre", path: "title"},
    {id: "description", name: "Description", path: "description"},
    {
      id: "type",
      name: "Type",
      selectPaths: ["type"],
      value: (row) => submissionTypeTranslateMap[row.type] ?? row.type,
    },
    {id: "deadline", name: "Date limite", path: "deadline"},
    {
      id: "required",
      name: "Obligatoire",
      enabledByDefault: false,
      selectPaths: ["required"],
      value: (row) => translateBoolean(row.required),
    },
    {
      id: "acceptedFormats",
      name: "Formats acceptés",
      enabledByDefault: false,
      selectPaths: ["acceptedFormats"],
      value: (row) => row.acceptedFormats.join(", "),
    },
    {
      id: "multiple",
      name: "Plusieurs fichiers",
      enabledByDefault: false,
      selectPaths: ["multiple"],
      value: (row) => row.multiple === null ? "" : translateBoolean(row.multiple),
    },
    {
      id: "submissionsCount",
      name: "Soumissions reçues",
      enabledByDefault: false,
      selectPaths: ["submissions.id"],
      requiredPermissions: ["participants.read"],
      value: (row) => row.submissions.length,
    },
    {id: "createdAt", name: "Créé le", enabledByDefault: true, path: "createdAt"},
    {id: "updatedAt", name: "Mis à jour le", enabledByDefault: false, path: "updatedAt"},
  ],
});

const roomsExportSchema = defineExportSchema<RoomExportRow>({
  resource: "rooms",
  name: "Salles",
  fileBaseName: "rooms",
  requiredPermissions: ["rooms.read", "rooms.export"],
  prismaDelegateKey: "room",
  orderBy: {sequence: "asc"},
  columns: [
    {id: "id", name: "ID", enabledByDefault: false, path: "id"},
    {id: "name", name: "Nom", path: "name"},
    {id: "sequence", name: "Ordre", path: "sequence"},
    {
      id: "teamsCount",
      name: "Nombre d'équipes",
      enabledByDefault: true,
      selectPaths: ["teams.id"],
      requiredPermissions: ["teams.read"],
      value: (row) => row.teams.length,
    },
    {
      id: "teamNames",
      name: "Équipes",
      enabledByDefault: false,
      selectPaths: ["teams.name"],
      requiredPermissions: ["teams.read"],
      value: (row) => row.teams.map((team) => team.name).filter(Boolean).join(", "),
    },
    {id: "createdAt", name: "Créé le", enabledByDefault: false, path: "createdAt"},
    {id: "updatedAt", name: "Mis à jour le", enabledByDefault: false, path: "updatedAt"},
  ],
});

export type AdminExportSchemaMap = {
  participants: typeof participantsExportSchema;
  teams: typeof teamsExportSchema;
  guests: typeof guestsExportSchema;
  sponsors: typeof sponsorsExportSchema;
  submissionRequests: typeof submissionRequestsExportSchema;
  rooms: typeof roomsExportSchema;
};

export const ADMIN_EXPORT_SCHEMAS = {
  participants: participantsExportSchema,
  teams: teamsExportSchema,
  guests: guestsExportSchema,
  sponsors: sponsorsExportSchema,
  submissionRequests: submissionRequestsExportSchema,
  rooms: roomsExportSchema,
} satisfies AdminExportSchemaMap;
