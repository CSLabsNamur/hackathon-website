import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { AdminCreateManyInput, RoomCreateInput, ScheduleItemCreateInput } from "./generated/prisma/models";
import "dotenv/config";
import { PERMISSION_CATALOG } from "../../shared/utils/authorization";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({adapter});

// Teams
//const teams: TeamCreateInput[] = [
//  {
//    name: "Team Alpha",
//    description: "Platform integration squad focused on auth and SSO.",
//    idea: "Build a unified login experience across products.",
//  },
//  {
//    name: "Team Beta",
//    description: "Experimentation and prototyping team.",
//    idea: "Rapidly validate new product ideas with lightweight prototypes.",
//  },
//  {
//    name: "Team Gamma",
//    description: "Performance and observability team.",
//    idea: "Improve metrics and monitoring pipelines.",
//  },
//  {
//    name: "Team Delta",
//    description: "Customer success integrations.",
//    idea: "Automate onboarding and support workflows.",
//  },
//];

// Participants
//type ParticipantSeed = Omit<ParticipantCreateManyInput, "teamId" | "userId"> & {
//  teamName?: string | null,
//  firstName: string,
//  lastName: string,
//  email: string,
//};
//const participants: ParticipantSeed[] = [
//  {
//    email: "aline@example.com",
//    firstName: "Aline",
//    lastName: "Boulanger",
//    githubAccount: "alineBO",
//    linkedInAccount: "aline-linkedin",
//    school: "UNamur",
//    diet: null,
//    needs: null,
//    caution: CautionStatus.NOT_PAID,
//    curriculumVitae: "/cvs/aline.pdf",
//    teamName: "Team Alpha",
//    imageAgreement: true,
//    newsletter: false,
//  },
//  {
//    email: "bob@example.com",
//    firstName: "Bob",
//    lastName: "Baker",
//    githubAccount: "bobGH",
//    linkedInAccount: null,
//    school: "Henallux",
//    diet: "Végétarien",
//    needs: null,
//    caution: CautionStatus.NOT_PAID,
//    curriculumVitae: null,
//    teamName: "Team Alpha",
//    imageAgreement: true,
//    newsletter: false,
//  },
//  {
//    email: "carol@example.com",
//    firstName: "Carol",
//    lastName: "Clark",
//    githubAccount: null,
//    linkedInAccount: "carol-linkedin",
//    school: "HEAJ",
//    diet: "Vegan",
//    needs: "Wheelchair access",
//    caution: CautionStatus.PAID,
//    curriculumVitae: "/cvs/carol.pdf",
//    teamName: "Team Beta",
//    imageAgreement: true,
//    newsletter: true,
//  },
//  {
//    email: "dan@example.com",
//    firstName: "Dan",
//    lastName: "Dawson",
//    githubAccount: "danGH",
//    linkedInAccount: null,
//    school: null,
//    diet: "Sans gluten",
//    needs: null,
//    caution: CautionStatus.REFUNDED,
//    curriculumVitae: null,
//    teamName: null, // no team
//    imageAgreement: true,
//    newsletter: false,
//  },
//  {
//    email: "erin@example.com",
//    firstName: "Erin",
//    lastName: "Edwards",
//    githubAccount: null,
//    linkedInAccount: "erin-linkedin",
//    school: "UCLouvain",
//    diet: null,
//    needs: null,
//    caution: CautionStatus.WAIVED,
//    curriculumVitae: null,
//    teamName: "Team Delta",
//    imageAgreement: true,
//    newsletter: false,
//  },
//  {
//    email: "frank@example.com",
//    firstName: "Frank",
//    lastName: "Foster",
//    githubAccount: "frankGH",
//    linkedInAccount: null,
//    school: "UMons",
//    diet: "Halal",
//    needs: null,
//    caution: CautionStatus.PAID,
//    curriculumVitae: null,
//    teamName: "Team Delta",
//    imageAgreement: true,
//    newsletter: true,
//  },
//];

// Admins
type AdminSeed = Omit<AdminCreateManyInput, "userId"> & { firstName: string, lastName: string, email: string };
const admins: AdminSeed[] = [
  {
    firstName: "IT",
    lastName: "Manager",
    email: "it@cslabs.be",
  },
];

// Permissions and roles
const participantPermissionKeys = [
  "participants.read.own",
  "participants.update.own",
  "teams.read.own",
  "teams.create.own",
  "teams.update.own",
  "teams.join",
  "teams.read",
  "submissionRequests.read",
  "submissions.read.own",
  "submissions.update.own",
  "submissions.delete.own",
  "rooms.read",
] as const;

const systemRoles = [
  {
    id: "participant",
    key: "participant",
    name: "Participant",
    description: "Rôle attribué automatiquement aux participants.",
    system: true,
    permissionKeys: participantPermissionKeys,
  },
  {
    id: "super_admin",
    key: "super_admin",
    name: "Super administrateur",
    description: "Accès complet à l'administration.",
    system: true,
    permissionKeys: PERMISSION_CATALOG.map((permission) => permission.key),
  },
] as const;

// Submission Requests
//const submissionRequests: SubmissionRequestCreateInput[] = [
//  //{
//  //  title: "CV",
//  //  type: SubmissionType.FILE,
//  //  description: "Envoyez votre curriculum vitae au format PDF.",
//  //  deadline: new Date("2026-03-28T23:59:59Z"),
//  //  acceptedFormats: ".pdf",
//  //  multiple: false,
//  //},
//  {
//    title: "Objectifs et motivation",
//    type: SubmissionType.TEXT,
//    description: "Décrivez vos objectifs personnels pour l'événement et ce qui vous motive à y participer.",
//    deadline: new Date("2026-03-27T23:59:59Z"),
//    required: true,
//  },
//];

// Schedule Items
const scheduleItems: ScheduleItemCreateInput[] = [
  {
    title: "Accueil & installation",
    description: "Récupération du badge et installation du matériel.",
    icon: "i-lucide-sparkles",
    dateString: "Vendredi 17h30",
    startTime: new Date("2026-03-27T17:30:00Z"),
    endTime: new Date("2026-03-27T18:00:00Z"),
  },
  {
    title: "Cérémonie d'ouverture",
    description: "Présentation du thème et formation des équipes.",
    icon: "i-lucide-rocket",
    dateString: "Vendredi 18h",
    startTime: new Date("2026-03-27T18:00:00Z"),
    endTime: new Date("2026-03-27T19:30:00Z"),
    special: true,
  },
  {
    title: "Activation des neurones",
    description: "Conception, code, tests… la nuit aussi pour les plus motivés.",
    icon: "i-lucide-moon-star",
    dateString: "Vendredi 19h30 - Dimanche matin",
    startTime: new Date("2026-03-27T19:30:00Z"),
    endTime: new Date("2026-03-29T12:00:00Z"),
  },
  {
    title: "Présentations intermédiaires aux coachs",
    description: "Feedbacks des coachs pour orienter le développement.",
    icon: "i-lucide-clipboard-list",
    dateString: "Samedi fin d'après‑midi",
    startTime: new Date("2026-03-28T16:00:00Z"),
    endTime: new Date("2026-03-28T18:00:00Z"),
  },
  {
    title: "Démonstration de la partie technique des projets",
    description: "Préparation du pitch et démonstrations.",
    icon: "i-lucide-presentation",
    dateString: "Dimanche 12h",
    startTime: new Date("2026-03-29T12:00:00Z"),
    endTime: new Date("2026-03-29T14:00:00Z"),
    special: true,
  },
  {
    title: "Pitch final devant le jury",
    description: "Présentation des projets aux membres du jury.",
    icon: "i-lucide-microscope",
    dateString: "Dimanche 14h",
    startTime: new Date("2026-03-29T14:00:00Z"),
    endTime: new Date("2026-03-29T16:00:00Z"),
    special: true,
  },
  {
    title: "Cérémonie de clôture & remise des prix",
    description: "Annonce des lauréats et remise des prix.",
    icon: "i-lucide-award",
    dateString: "Dimanche 17h",
    startTime: new Date("2026-03-29T16:00:00Z"),
    endTime: new Date("2026-03-29T17:00:00Z"),
    special: true,
  },
  {
    title: "Cocktail de fin",
    description: "Un dernier moment convivial pour clôturer l'événement.",
    icon: "i-lucide-martini",
    dateString: "Dimanche 18h",
    startTime: new Date("2026-03-29T18:00:00Z"),
    endTime: new Date("2026-03-29T19:00:00Z"),
    special: true,
  },
];

// Rooms
const rooms: RoomCreateInput[] = [
  {
    id: "info-i30",
    name: "Salle I30",
    sequence: 1,
  },
  {
    id: "info-i31",
    name: "Salle I31",
    sequence: 2,
  },
  {
    id: "info-i32",
    name: "Salle I32",
    sequence: 3,
  },
  {
    id: "info-i33",
    name: "Salle I33",
    sequence: 4,
  },
  {
    id: "info-open-space-3",
    name: "Salle Open Space",
    sequence: 5,
  },
];

async function main() {
  //region Permissions and roles
  // Upsert permissions to ensure they exist and are updated if the catalog changes
  await prisma.$transaction(PERMISSION_CATALOG.map((permission) => prisma.permission.upsert({
    where: {
      key: permission.key,
    },
    create: permission,
    update: {
      group: permission.group,
      name: permission.name,
      description: null,
    },
  })));

  // Create the two default system roles
  await prisma.$transaction(systemRoles.map((role) => prisma.role.upsert({
    where: {
      key: role.key,
    },
    create: {
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description,
      system: role.system,
    },
    update: {
      name: role.name,
      description: role.description,
      system: role.system,
    },
  })));

  // Fetch permissions to get their IDs for role-permission assignments
  const permissionRows = await prisma.permission.findMany({
    where: {
      key: {
        in: PERMISSION_CATALOG.map((permission) => permission.key),
      },
    },
    select: {
      id: true,
      key: true,
    },
  });
  const permissionIdByKey = new Map(permissionRows.map((permission) => [permission.key, permission.id]));

  // Assign permissions to system roles
  for (const roleSeed of systemRoles) {
    const role = await prisma.role.findUniqueOrThrow({
      where: {
        key: roleSeed.key,
      },
      select: {
        id: true,
      },
    });

    await prisma.rolePermission.createMany({
      data: roleSeed.permissionKeys.map((permissionKey) => ({
        roleId: role.id,
        permissionId: permissionIdByKey.get(permissionKey)!,
      })),
      skipDuplicates: true,
    });
  }
  //endregion

  //region Teams
  //await prisma.team.createMany({data: teams, skipDuplicates: true});
  //
  //const teamRows = await prisma.team.findMany({select: {id: true, name: true}});
  //const teamIdByName = new Map(teamRows.map(t => [t.name, t.id]));
  //endregion

  //region Users
  // Create users for admins
  const adminUserData = admins.map(({email, firstName, lastName}) => ({
    email,
    firstName,
    lastName,
  }));
  await prisma.user.createMany({
    data: adminUserData,
    skipDuplicates: true,
  });

  // Create users for participants
  //const userData = participants.map(({email, firstName, lastName}) => ({
  //  email,
  //  firstName,
  //  lastName,
  //}));
  //await prisma.user.createMany({
  //  data: userData,
  //  skipDuplicates: true,
  //});

  // Fetch all users to map email to userId
  const users = await prisma.user.findMany();
  const userIdByEmail = new Map(users.map(u => [u.email, u.id]));
  //endregion

  //region Participants
  //const participantData: ParticipantCreateManyInput[] = participants.map(({
  //                                                                          teamName,
  //                                                                          firstName,
  //                                                                          lastName,
  //                                                                          email,
  //                                                                          ...rest
  //                                                                        }) => ({
  //  ...rest,
  //  teamId: teamName ? teamIdByName.get(teamName) ?? null : null,
  //  userId: userIdByEmail.get(email)!,
  //}));
  //
  //await prisma.participant.createMany({
  //  data: participantData,
  //  skipDuplicates: true,
  //});
  //endregion

  //region Admins
  const adminData: AdminCreateManyInput[] = admins.map(({firstName, lastName, email, ...rest}) => ({
    ...rest,
    userId: userIdByEmail.get(email)!,
  }));
  await prisma.admin.createMany({
    data: adminData,
    skipDuplicates: true,
  });
  //endregion

  //region Role assignments backfill
  const [participantRole, superAdminRole] = await prisma.$transaction([
    prisma.role.findUniqueOrThrow({
      where: {
        key: "participant",
      },
      select: {
        id: true,
      },
    }),
    prisma.role.findUniqueOrThrow({
      where: {
        key: "super_admin",
      },
      select: {
        id: true,
      },
    }),
  ]);

  const [participantUsers, adminUsers] = await prisma.$transaction([
    prisma.participant.findMany({
      select: {
        userId: true,
      },
    }),
    prisma.admin.findMany({
      select: {
        userId: true,
      },
    }),
  ]);

  if (participantUsers.length > 0) {
    await prisma.userRoleAssignment.createMany({
      data: participantUsers.map((participant) => ({
        userId: participant.userId,
        roleId: participantRole.id,
      })),
      skipDuplicates: true,
    });
  }

  if (adminUsers.length > 0) {
    await prisma.userRoleAssignment.createMany({
      data: adminUsers.map((admin) => ({
        userId: admin.userId,
        roleId: superAdminRole.id,
      })),
      skipDuplicates: true,
    });
  }
  //endregion

  //region Submission Requests
  //await prisma.submissionRequest.createMany({
  //  data: submissionRequests,
  //  skipDuplicates: true,
  //});
  //endregion

  //region Schedule Items
  await prisma.scheduleItem.createMany({
    data: scheduleItems,
    skipDuplicates: true,
  });
  //endregion

  //region Rooms
  await prisma.room.createMany({
    data: rooms,
    skipDuplicates: true,
  });
  //endregion
}

main().finally(async () => {
  console.log("Seeding completed.");
  await prisma.$disconnect();
});
