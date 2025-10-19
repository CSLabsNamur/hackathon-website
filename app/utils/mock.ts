import { computed, reactive } from "vue";

export const adminUser = computed(() => ({
  name: "Admin User",
  email: "it@cslabs.be",
  avatar: {
    src: "https://i.pravatar.cc/150?u=adminuser",
    alt: "Admin User Avatar",
    icon: "i-lucide-image",
  },
}));

export type User = {
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
  createdAt: number;
}

export enum CautionStatus {
  Paid = "Payé",
  NotPaid = "Non Payé",
  Refunded = "Remboursé",
  Waived = "Exonéré",
}

export const users: User[] = reactive([
  {
    id: "u1-0a1b",
    email: "aline@example.com",
    firstName: "Aline",
    lastName: "Boulanger",
    githubAccount: "https://github.com/alineBO",
    linkedinAccount: "https://www.linkedin.com/in/aline-linkedin",
    school: "UNamur",
    diet: null, // changed from "None" to null
    needs: null,
    caution: CautionStatus.NotPaid,
    isAdmin: false,
    curriculumVitae: null,
    password: "password-placeholder",
    isTeamOwner: true, // owner of Team Alpha
    team: "f47ac10b-58cc-4372-a567-0e02b2c3d479", // Team Alpha
    imageAgreement: true,
    newsletter: false,
    createdAt: 1699980000000,
  },
  {
    id: "u2-0a2b",
    email: "bob@example.com",
    firstName: "Bob",
    lastName: "Baker",
    githubAccount: "https://github.com/bobGH",
    linkedinAccount: null,
    school: "Henallux",
    diet: "Végétarien", // changed from "Vegetarian"
    needs: null,
    caution: CautionStatus.NotPaid,
    isAdmin: false,
    curriculumVitae: null,
    password: "password-placeholder",
    isTeamOwner: false,
    team: "f47ac10b-58cc-4372-a567-0e02b2c3d479", // Team Alpha
    imageAgreement: true,
    newsletter: false,
    createdAt: 1699970000000,
  },
  {
    id: "u3-0a3b",
    email: "carol@example.com",
    firstName: "Carol",
    lastName: "Clark",
    githubAccount: null,
    linkedinAccount: "https://www.linkedin.com/in/carol-linkedin",
    school: "HEAJ",
    diet: "Vegan", // unchanged, already valid
    needs: "Wheelchair access",
    caution: CautionStatus.Paid,
    isAdmin: false,
    curriculumVitae: "/cvs/carol.pdf",
    password: "password-placeholder",
    isTeamOwner: true, // owner of Team Beta
    team: "a3c9f1d2-6b7e-4f2a-9c8d-1234567890ab", // Team Beta
    imageAgreement: true,
    newsletter: true,
    createdAt: 1699000000000,
  },
  {
    id: "u4-0a4b",
    email: "dan@example.com",
    firstName: "Dan",
    lastName: "Dawson",
    githubAccount: "https://github.com/danGH",
    linkedinAccount: null,
    school: null,
    diet: "Sans gluten", // changed from "Gluten-free"
    needs: null,
    caution: CautionStatus.Refunded,
    isAdmin: false,
    curriculumVitae: null,
    password: "password-placeholder",
    isTeamOwner: false,
    team: "9b8a7c6d-5555-6666-7777-0123456789ab", // Team Delta
    imageAgreement: true,
    newsletter: false,
    createdAt: 1677000000000,
  },
  {
    id: "u5-0a5b",
    email: "erin@example.com",
    firstName: "Erin",
    lastName: "Edwards",
    githubAccount: null,
    linkedinAccount: "https://www.linkedin.com/in/erin-linkedin",
    school: "UCLouvain",
    diet: null, // unchanged (was null)
    needs: null,
    caution: CautionStatus.Waived,
    isAdmin: false,
    curriculumVitae: null,
    password: "password-placeholder",
    isTeamOwner: false,
    team: "9b8a7c6d-5555-6666-7777-0123456789ab", // Team Delta
    imageAgreement: true,
    newsletter: false,
    createdAt: 1677001000000,
  },
  {
    id: "u6-0a6b",
    email: "frank@example.com",
    firstName: "Frank",
    lastName: "Foster",
    githubAccount: "https://github.com/frankGH",
    linkedinAccount: null,
    school: "UMons",
    diet: "Halal", // unchanged, already valid
    needs: null,
    caution: CautionStatus.Paid,
    isAdmin: false,
    curriculumVitae: null,
    password: "password-placeholder",
    isTeamOwner: false,
    team: "9b8a7c6d-5555-6666-7777-0123456789ab", // Team Delta
    imageAgreement: true,
    newsletter: true,
    createdAt: 1677002000000,
  },
]);

export const teams = [
  {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    name: "Team Alpha",
    description: "Platform integration squad focused on auth and SSO.",
    idea: "Build a unified login experience across products.",
    token: "alpha-9f3b2c",
    valid: true,
    members: ["u1-0a1b", "u2-0a2b"],
    createdAt: 1699992000000,
  },
  {
    id: "a3c9f1d2-6b7e-4f2a-9c8d-1234567890ab",
    name: "Team Beta",
    description: "Experimentation and prototyping team.",
    idea: "Rapidly validate new product ideas with lightweight prototypes.",
    token: "beta-4e7d1a",
    valid: false,
    members: ["u3-0a3b"],
    createdAt: 1699000000000,
  },
  {
    id: "d2e4b7c8-1111-2222-3333-abcdefabcdef",
    name: "Team Gamma",
    description: "Performance and observability team.",
    idea: "Improve metrics and monitoring pipelines.",
    token: "gamma-0b8c7d",
    valid: true,
    members: [],
    createdAt: 1688000000000,
  },
  {
    id: "9b8a7c6d-5555-6666-7777-0123456789ab",
    name: "Team Delta",
    description: "Customer success integrations.",
    idea: "Automate onboarding and support workflows.",
    token: "delta-2c3f9e",
    valid: true,
    members: ["u4-0a4b", "u5-0a5b", "u6-0a6b"],
    createdAt: 1677000000000,
  },
];
