import type { Model, PrismaModel, PrismaQueryOf, Subjects, WhereInputOf } from "@casl/prisma";
import type * as P from "../prisma/generated/prisma/client";
import type { Prisma } from "../prisma/generated/prisma/client";

export { createPrismaAbility } from "@casl/prisma";

export type AppPrismaQuery<T extends PrismaModel = Model<Record<string, unknown>, string>> = PrismaQueryOf<Prisma.TypeMap, T>;
export type WhereInput<TModelName extends Prisma.ModelName> = WhereInputOf<Prisma.TypeMap, TModelName>;

type AppPrismaSubjects = Subjects<{
  User: P.User;
  Admin: P.Admin;
  Participant: P.Participant;
  Team: P.Team;
  Guest: P.Guest;
  Sponsor: P.Sponsor;
  SubmissionRequest: P.SubmissionRequest;
  Submission: P.Submission;
  SubmissionFile: P.SubmissionFile;
  ScheduleItem: P.ScheduleItem;
  Room: P.Room;
  Role: P.Role;
  Permission: P.Permission;
}>;

export type AppSubject = AppPrismaSubjects | Exclude<AppSubjectName, Prisma.ModelName>;
