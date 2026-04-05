import {
  createPrismaAbilityFor,
  type Model,
  type PrismaModel,
  type PrismaQueryOf,
  type Subjects,
  type WhereInputOf,
} from "@casl/prisma";
import type * as P from "../prisma/generated/prisma/client";
import type { Prisma } from "../prisma/generated/prisma/client";

export const createPrismaAbility = createPrismaAbilityFor<Prisma.TypeMap>();

export type AppPrismaQuery<T extends PrismaModel = Model<Record<string, unknown>, string>> = PrismaQueryOf<Prisma.TypeMap, T>;
export type WhereInput<TModelName extends Prisma.ModelName> = WhereInputOf<Prisma.TypeMap, TModelName>;

// Catalog types for CASL, to update when adding new permissions or DB models.
export type AppAction =
  | "read"
  | "readSensitive"
  | "checkIn"
  | "create"
  | "update"
  | "updateSensitive"
  | "delete"
  | "export"
  | "exportSensitive"
  | "send"
  | "assign"
  | "print";

export type AppSubject =
  | "all"
  | "Broadcast"
  | "Badge"
  | Subjects<{
  User: P.User;
  Admin: P.Admin;
  Participant: P.Participant;
  Team: P.Team;
  Guest: P.Guest;
  Sponsor: P.Sponsor;
  SubmissionRequest: P.SubmissionRequest;
  Submission: P.Submission;
  SubmissionFile: P.SubmissionFile;
  Room: P.Room;
  Role: P.Role;
  Permission: P.Permission;
}>;
