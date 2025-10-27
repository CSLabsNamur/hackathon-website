import { computed, reactive } from "vue";
import type { AvatarProps } from "#ui/components/Avatar.vue";
import type { TimelineItem } from "@nuxt/ui";

const dayjs = useDayjs();

//region ==== Users & Teams ====
export type User = {
  name: string;
  email: string;
  avatar: AvatarProps;
}

export const adminUser = computed<User>(() => ({
  name: "Admin User",
  email: "it@cslabs.be",
  avatar: {
    src: "https://i.pravatar.cc/150?u=adminuser",
    alt: "Admin User Avatar",
    icon: "i-lucide-image",
  },
}));

export type Participant = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  githubAccount: string | null;
  linkedinAccount: string | null;
  school: "UNamur" | "Henallux" | "HEAJ" | "UCLouvain" | "ULiège" | "UMons" | "ULB" | "Hors Belgique" | "Autre" | null;
  diet: "Végétarien" | "Vegan" | "Sans gluten" | "Halal" | "Kasher" | "Autre" | null;
  needs: string | null;
  caution: CautionStatus;
  isAdmin: boolean;
  curriculumVitae: string | null;
  password: string;
  isTeamOwner: boolean;
  team: string | null;
  imageAgreement: boolean;
  newsletter: boolean;
  submissions: Submission[];
  createdAt: number;
}

export enum CautionStatus {
  Paid = "Payé",
  NotPaid = "Non Payé",
  Refunded = "Remboursé",
  Waived = "Exonéré",
}

export const participants = ref<Participant[]>([
  {
    id: "u1-0a1b",
    email: "aline@example.com",
    firstName: "Aline",
    lastName: "Boulanger",
    githubAccount: "https://github.com/alineBO",
    linkedinAccount: "https://www.linkedin.com/in/aline-linkedin",
    school: "UNamur",
    diet: null,
    needs: null,
    caution: CautionStatus.NotPaid,
    isAdmin: false,
    curriculumVitae: "/cvs/aline.pdf",
    //curriculumVitae: null,
    password: "password-placeholder",
    isTeamOwner: true, // owner of Team Alpha
    team: "f47ac10b-58cc-4372-a567-0e02b2c3d479", // Team Alpha
    //team: null,
    imageAgreement: true,
    newsletter: false,
    submissions: [],
    createdAt: dayjs("2025-09-14T09:00:00Z").valueOf(), // 2025-09-14 09:00 UTC
  },
  {
    id: "u2-0a2b",
    email: "bob@example.com",
    firstName: "Bob",
    lastName: "Baker",
    githubAccount: "https://github.com/bobGH",
    linkedinAccount: null,
    school: "Henallux",
    diet: "Végétarien",
    needs: null,
    caution: CautionStatus.NotPaid,
    isAdmin: false,
    curriculumVitae: null,
    password: "password-placeholder",
    isTeamOwner: false,
    team: "f47ac10b-58cc-4372-a567-0e02b2c3d479", // Team Alpha
    imageAgreement: true,
    newsletter: false,
    submissions: [],
    createdAt: dayjs("2025-11-01T11:15:00Z").valueOf(), // 2025-10-01 11:15 UTC
  },
  {
    id: "u3-0a3b",
    email: "carol@example.com",
    firstName: "Carol",
    lastName: "Clark",
    githubAccount: null,
    linkedinAccount: "https://www.linkedin.com/in/carol-linkedin",
    school: "HEAJ",
    diet: "Vegan",
    needs: "Wheelchair access",
    caution: CautionStatus.Paid,
    isAdmin: false,
    curriculumVitae: "/cvs/carol.pdf",
    password: "password-placeholder",
    isTeamOwner: true, // owner of Team Beta
    team: "a3c9f1d2-6b7e-4f2a-9c8d-1234567890ab", // Team Beta
    imageAgreement: true,
    newsletter: true,
    submissions: [],
    createdAt: dayjs("2025-11-20T16:45:00Z").valueOf(), // 2025-11-20 16:45 UTC
  },
  {
    id: "u4-0a4b",
    email: "dan@example.com",
    firstName: "Dan",
    lastName: "Dawson",
    githubAccount: "https://github.com/danGH",
    linkedinAccount: null,
    school: null,
    diet: "Sans gluten",
    needs: null,
    caution: CautionStatus.Refunded,
    isAdmin: false,
    curriculumVitae: null,
    password: "password-placeholder",
    isTeamOwner: false,
    team: null,
    imageAgreement: true,
    newsletter: false,
    submissions: [],
    createdAt: dayjs("2026-01-05T10:15:00Z").valueOf(), // 2026-01-05 10:15 UTC
  },
  {
    id: "u5-0a5b",
    email: "erin@example.com",
    firstName: "Erin",
    lastName: "Edwards",
    githubAccount: null,
    linkedinAccount: "https://www.linkedin.com/in/erin-linkedin",
    school: "UCLouvain",
    diet: null,
    needs: null,
    caution: CautionStatus.Waived,
    isAdmin: false,
    curriculumVitae: null,
    password: "password-placeholder",
    isTeamOwner: false,
    team: "9b8a7c6d-5555-6666-7777-0123456789ab", // Team Delta
    imageAgreement: true,
    newsletter: false,
    submissions: [],
    createdAt: dayjs("2026-02-14T08:00:00Z").valueOf(), // 2026-02-14 08:00 UTC
  },
  {
    id: "u6-0a6b",
    email: "frank@example.com",
    firstName: "Frank",
    lastName: "Foster",
    githubAccount: "https://github.com/frankGH",
    linkedinAccount: null,
    school: "UMons",
    diet: "Halal",
    needs: null,
    caution: CautionStatus.Paid,
    isAdmin: false,
    curriculumVitae: null,
    password: "password-placeholder",
    isTeamOwner: false,
    team: "9b8a7c6d-5555-6666-7777-0123456789ab", // Team Delta
    imageAgreement: true,
    newsletter: true,
    submissions: [],
    createdAt: dayjs("2026-03-26T18:30:00Z").valueOf(), // 2026-03-26 18:30 UTC
  },
]);

export const currentParticipant = participants.value[0]!;
export const currentTeam = computed<Team | null>(() => {
  if (!currentParticipant.team) {
    return null;
  }
  return teams.value.find(team => team.id === currentParticipant.team) || null;
});

export type Team = {
  id: string;
  name: string;
  description?: string;
  idea?: string;
  token: string;
  members: string[];
  createdAt: number;
}

export const teams = ref<Team[]>([
  {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    name: "Team Alpha",
    description: "Platform integration squad focused on auth and SSO.",
    idea: "Build a unified login experience across products.",
    token: "alpha-9f3b2c",
    members: ["u1-0a1b", "u2-0a2b"],
    createdAt: 1699992000000,
  },
  {
    id: "a3c9f1d2-6b7e-4f2a-9c8d-1234567890ab",
    name: "Team Beta",
    description: "Experimentation and prototyping team.",
    idea: "Rapidly validate new product ideas with lightweight prototypes.",
    token: "beta-4e7d1a",
    members: ["u3-0a3b"],
    createdAt: 1699000000000,
  },
  {
    id: "d2e4b7c8-1111-2222-3333-abcdefabcdef",
    name: "Team Gamma",
    description: "Performance and observability team.",
    idea: "Improve metrics and monitoring pipelines.",
    token: "gamma-0b8c7d",
    members: [],
    createdAt: 1688000000000,
  },
  {
    id: "9b8a7c6d-5555-6666-7777-0123456789ab",
    name: "Team Delta",
    description: "Customer success integrations.",
    idea: "Automate onboarding and support workflows.",
    token: "delta-2c3f9e",
    members: ["u4-0a4b", "u5-0a5b", "u6-0a6b"],
    createdAt: 1677000000000,
  },
]);

export const isTeamValid = computed(() => (teamId: string) => {
  const team = teams.value.find(t => t.id === teamId);
  if (!team) {
    throw new Error("Team not found");
  }
  return team.members.every(member => {
    const participant = participants.value.find(u => u.id === member);
    const caution = participant?.caution;
    return caution === CautionStatus.Paid || caution === CautionStatus.Waived;
  });
});
//endregion

//region ==== Document Submission ====
interface SubmissionBase {
  id: string;
  title: string;
  description?: string;
  deadline: number;
  required?: boolean;
  createdAt: number;
}

export type SubmissionRequest =
  (SubmissionBase & { type: "text" }) |
  (SubmissionBase & { type: "file"; acceptedFormats?: string[]; multiple?: boolean });

export type Submission = {
  requestId: string;
  content: string | File | File[];
  submittedAt: number;
  skipped: false;
} | {
  requestId: string;
  submittedAt: number;
  skipped: true;
};

export const submissionRequests = ref<SubmissionRequest[]>([
  {
    id: "sub-001",
    type: "file",
    title: "CV",
    description: "Envoyez votre curriculum vitae au format PDF.",
    deadline: dayjs("2025-12-31T23:59:59Z").valueOf(),
    acceptedFormats: [".pdf"],
    multiple: false,
    createdAt: dayjs("2025-10-01T00:00:00Z").valueOf(),
  },
  {
    id: "sub-002",
    type: "text",
    title: "Objectifs et motivation",
    description: "Décrivez vos objectifs personnels pour l'événement et ce qui vous motive à y participer.",
    deadline: dayjs("2026-01-15T23:59:59Z").valueOf(),
    required: true,
    createdAt: dayjs("2025-11-01T00:00:00Z").valueOf(),
  },
]);
//endregion

//region ==== Program Schedule ====
type ScheduleItem = TimelineItem & ({
  exactDateTime?: [number, number];
  special?: false;
} | {
  exactDateTime: [number, number];
  special: true
});
type ScheduleSpecialItem = ScheduleItem & { special: true };

// TODO: Add a check to ensure no overlapping exactDateTime ranges when the event is noted as special.
export const timeline: ScheduleItem[] = [
  {
    title: "Accueil & installation",
    description: "Récupération du badge et installation du matériel.",
    icon: "i-lucide-sparkles",
    date: "Vendredi 17h30",
    exactDateTime: [dayjs("2026-03-27T17:30:00Z").valueOf(), dayjs("2026-03-27T18:00:00Z").valueOf()],
  },
  {
    title: "Cérémonie d'ouverture",
    description: "Présentation du thème et formation des équipes.",
    icon: "i-lucide-rocket",
    date: "Vendredi 18h",
    exactDateTime: [dayjs("2026-03-27T18:00:00Z").valueOf(), dayjs("2026-03-27T19:30:00Z").valueOf()],
    special: true,
  },
  {
    title: "Activation des neurones",
    description: "Conception, code, tests… la nuit aussi pour les plus motivés.",
    icon: "i-lucide-moon-star",
    date: "Vendredi 19h30 - Dimanche matin",
    exactDateTime: [dayjs("2026-03-27T19:30:00Z").valueOf(), dayjs("2026-03-29T12:00:00Z").valueOf()],
  },
  {
    title: "Présentations intermédiaires aux coachs",
    description: "Feedbacks des coachs pour orienter le développement.",
    icon: "i-lucide-clipboard-list",
    date: "Samedi fin d'après‑midi",
    exactDateTime: [dayjs("2026-03-28T16:00:00Z").valueOf(), dayjs("2026-03-28T18:00:00Z").valueOf()],
  },
  {
    title: "Démonstration de la partie technique des projets",
    description: "Préparation du pitch et démonstrations.",
    icon: "i-lucide-presentation",
    date: "Dimanche 12h",
    exactDateTime: [dayjs("2026-03-29T12:00:00Z").valueOf(), dayjs("2026-03-29T14:00:00Z").valueOf()],
    special: true,
  },
  {
    title: "Pitch final devant le jury",
    description: "Présentation des projets aux membres du jury.",
    icon: "i-lucide-microscope",
    date: "Dimanche 14h",
    exactDateTime: [dayjs("2026-03-29T14:00:00Z").valueOf(), dayjs("2026-03-29T16:00:00Z").valueOf()],
    special: true,
  },
  {
    title: "Cérémonie de clôture & remise des prix",
    description: "Annonce des lauréats et remise des prix.",
    icon: "i-lucide-award",
    date: "Dimanche 17h",
    exactDateTime: [dayjs("2026-03-29T16:00:00Z").valueOf(), dayjs("2026-03-29T17:00:00Z").valueOf()],
    special: true,
  },
  {
    title: "Cocktail de fin",
    description: "Un dernier moment convivial pour clôturer l'événement.",
    icon: "i-lucide-martini",
    date: "Dimanche 18h",
    exactDateTime: [dayjs("2026-03-29T18:00:00Z").valueOf(), dayjs("2026-03-29T19:00:00Z").valueOf()],
    special: true,
  },
];

export const mockCurrentDateTime = dayjs("2026-03-29T16:31:00Z");

export const nextSpecialEvent = computed<ScheduleSpecialItem | null>(() => {
  return timeline.find(item => item.special && item.exactDateTime && !dayjs(item.exactDateTime[0]).isBefore(mockCurrentDateTime) && mockCurrentDateTime.isAfter(dayjs(item.exactDateTime[0]).subtract(2, "hour"))) as ScheduleSpecialItem || null;
});
//endregion
