import { Prisma } from "~~/server/prisma/generated/prisma/browser";
import type { SerializeObject } from "nitropack";

// Exports every Prisma type for general use in the app with Nuxt's auto-imports
export { SubmissionType, CautionStatus } from "../../server/prisma/generated/prisma/browser";

// Custom types, for additional relationships or specific use
// TODO: Huge problem: These types are not updated automatically when the Prisma schema changes. Need to refactor to use global includes.
export type Team = SerializeObject<Prisma.TeamGetPayload<{ include: { members: true, room: true } }>>;
export type Participant = SerializeObject<Prisma.ParticipantGetPayload<{
  include: {
    team: {
      include: {
        members: {
          include: { user: true, submissions: { include: { request: true }, select: { id: true, requestId: true } } }
        }
      }
    },
    submissions: { include: { request: true } },
    user: true
  }
}>>;
export type ParticipantWithoutRelations = Omit<Participant, "team" | "submissions">;
export type Admin = SerializeObject<Prisma.AdminGetPayload<{ include: { user: true } }>>;
export type Room = SerializeObject<Prisma.RoomGetPayload<{ include: { teams: true } }>>;
export type Submission = SerializeObject<Prisma.SubmissionGetPayload<{
  include: { participant: true, request: true }
}>>;
export type SubmissionRequest = SerializeObject<Prisma.SubmissionRequestGetPayload<{
  include: { submissions: true }
}>>;
export type ScheduleItem = SerializeObject<Prisma.ScheduleItemGetPayload<{}>>;
export type Schedule = ScheduleItem[];
