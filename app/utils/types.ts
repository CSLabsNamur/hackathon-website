import { Prisma } from "~~/server/prisma/generated/prisma/browser";
import type { SerializeObject } from "nitropack";

// Exports every Prisma type for general use in the app with Nuxt's auto-imports
export { SubmissionType, CautionStatus, type Admin } from "../../server/prisma/generated/prisma/browser";

// Custom types, for additional relationships or specific use-
export type Team = SerializeObject<Prisma.TeamGetPayload<{ include: { members: true, room: true } }>>;
export type Participant = SerializeObject<Prisma.ParticipantGetPayload<{
  include: { team: { include: { members: true } }, submissions: true }
}>>;
export type ParticipantWithoutRelations = Omit<Participant, "team" | "submissions">;
export type Room = SerializeObject<Prisma.RoomGetPayload<{ include: { teams: true } }>>;
export type Submission = SerializeObject<Prisma.SubmissionGetPayload<{
  include: { participant: true, request: true }
}>>;
export type SubmissionRequest = SerializeObject<Prisma.SubmissionRequestGetPayload<{
  include: { submissions: true }
}>>;
export type ScheduleItem = SerializeObject<Prisma.ScheduleItemGetPayload<{}>>;
export type Schedule = ScheduleItem[];
