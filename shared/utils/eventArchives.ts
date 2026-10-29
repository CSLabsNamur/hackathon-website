import type { Prisma } from "~~/server/prisma/generated/prisma/browser";
import type { SerializeObject } from "nitropack";

export type EventArchiveDetails = Omit<SerializeObject<Prisma.EventArchiveGetPayload<object>>, "snapshot"> & {
  snapshot: EventArchiveSnapshot;
};

export type EventArchiveSnapshot = {
  slogan: string;
  locationName: string;
  locationAddress: string;
  logoPath: string | null;
  counts: { participants: number; teams: number; guests: number; submissions: number };
  schedule: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    icon: string | null;
    special: boolean
  }[];
  sponsors: { name: string; description: Prisma.JsonValue; logo: string; url: string }[];
};
