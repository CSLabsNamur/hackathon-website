import { PrismaClient, SubmissionType } from "./generated/prisma/client";
import type {
  AdminCreateManyInput,
  ParticipantCreateManyInput,
  RoomCreateInput,
  ScheduleItemCreateInput,
  SubmissionRequestCreateInput,
  TeamCreateInput,
} from "./generated/prisma/models";
import { CautionStatus } from "./generated/prisma/enums";
import "dotenv/config";

const prisma = new PrismaClient();

// Teams
const teams: TeamCreateInput[] = [
  {
    name: "Team Alpha",
    description: "Platform integration squad focused on auth and SSO.",
    idea: "Build a unified login experience across products.",
  },
  {
    name: "Team Beta",
    description: "Experimentation and prototyping team.",
    idea: "Rapidly validate new product ideas with lightweight prototypes.",
  },
  {
    name: "Team Gamma",
    description: "Performance and observability team.",
    idea: "Improve metrics and monitoring pipelines.",
  },
  {
    name: "Team Delta",
    description: "Customer success integrations.",
    idea: "Automate onboarding and support workflows.",
  },
];

// Participants
type ParticipantSeed = Omit<ParticipantCreateManyInput, "teamId" | "userId"> & {
  teamName?: string | null,
  firstName: string,
  lastName: string,
  email: string,
};
const participants: ParticipantSeed[] = [
  {
    email: "aline@example.com",
    firstName: "Aline",
    lastName: "Boulanger",
    githubAccount: "alineBO",
    linkedInAccount: "aline-linkedin",
    school: "UNamur",
    diet: null,
    needs: null,
    caution: CautionStatus.NOT_PAID,
    curriculumVitae: "/cvs/aline.pdf",
    teamName: "Team Alpha",
    imageAgreement: true,
    newsletter: false,
  },
  {
    email: "bob@example.com",
    firstName: "Bob",
    lastName: "Baker",
    githubAccount: "bobGH",
    linkedInAccount: null,
    school: "Henallux",
    diet: "Végétarien",
    needs: null,
    caution: CautionStatus.NOT_PAID,
    curriculumVitae: null,
    teamName: "Team Alpha",
    imageAgreement: true,
    newsletter: false,
  },
  {
    email: "carol@example.com",
    firstName: "Carol",
    lastName: "Clark",
    githubAccount: null,
    linkedInAccount: "carol-linkedin",
    school: "HEAJ",
    diet: "Vegan",
    needs: "Wheelchair access",
    caution: CautionStatus.PAID,
    curriculumVitae: "/cvs/carol.pdf",
    teamName: "Team Beta",
    imageAgreement: true,
    newsletter: true,
  },
  {
    email: "dan@example.com",
    firstName: "Dan",
    lastName: "Dawson",
    githubAccount: "danGH",
    linkedInAccount: null,
    school: null,
    diet: "Sans gluten",
    needs: null,
    caution: CautionStatus.REFUNDED,
    curriculumVitae: null,
    teamName: null, // no team
    imageAgreement: true,
    newsletter: false,
  },
  {
    email: "erin@example.com",
    firstName: "Erin",
    lastName: "Edwards",
    githubAccount: null,
    linkedInAccount: "erin-linkedin",
    school: "UCLouvain",
    diet: null,
    needs: null,
    caution: CautionStatus.WAIVED,
    curriculumVitae: null,
    teamName: "Team Delta",
    imageAgreement: true,
    newsletter: false,
  },
  {
    email: "frank@example.com",
    firstName: "Frank",
    lastName: "Foster",
    githubAccount: "frankGH",
    linkedInAccount: null,
    school: "UMons",
    diet: "Halal",
    needs: null,
    caution: CautionStatus.PAID,
    curriculumVitae: null,
    teamName: "Team Delta",
    imageAgreement: true,
    newsletter: true,
  },
];

// Admins
type AdminSeed = Omit<AdminCreateManyInput, "userId"> & { firstName: string, lastName: string, email: string };
const admins: AdminSeed[] = [
  {
    firstName: "Admin",
    lastName: "User",
    email: "it@cslabs.be",
  },
];

// Submission Requests
const submissionRequests: SubmissionRequestCreateInput[] = [
  //{
  //  title: "CV",
  //  type: SubmissionType.FILE,
  //  description: "Envoyez votre curriculum vitae au format PDF.",
  //  deadline: new Date("2026-03-28T23:59:59Z"),
  //  acceptedFormats: ".pdf",
  //  multiple: false,
  //},
  {
    title: "Objectifs et motivation",
    type: SubmissionType.TEXT,
    description: "Décrivez vos objectifs personnels pour l'événement et ce qui vous motive à y participer.",
    deadline: new Date("2026-03-27T23:59:59Z"),
    required: true,
  },
];

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
  //region Teams
  await prisma.team.createMany({data: teams, skipDuplicates: true});

  const teamRows = await prisma.team.findMany({select: {id: true, name: true}});
  const teamIdByName = new Map(teamRows.map(t => [t.name, t.id]));
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
  const userData = participants.map(({email, firstName, lastName}) => ({
    email,
    firstName,
    lastName,
  }));
  await prisma.user.createMany({
    data: userData,
    skipDuplicates: true,
  });

  // Fetch all users to map email to userId
  const users = await prisma.user.findMany();
  const userIdByEmail = new Map(users.map(u => [u.email, u.id]));
  //endregion

  //region Participants
  const participantData: ParticipantCreateManyInput[] = participants.map(({
                                                                            teamName,
                                                                            firstName,
                                                                            lastName,
                                                                            email,
                                                                            ...rest
                                                                          }) => ({
    ...rest,
    teamId: teamName ? teamIdByName.get(teamName) ?? null : null,
    userId: userIdByEmail.get(email)!,
  }));

  await prisma.participant.createMany({
    data: participantData,
    skipDuplicates: true,
  });
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

  //region Submission Requests
  await prisma.submissionRequest.createMany({
    data: submissionRequests,
    skipDuplicates: true,
  });
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
  await prisma.$disconnect();
});