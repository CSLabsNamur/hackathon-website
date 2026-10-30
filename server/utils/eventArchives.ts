import { createHash } from "node:crypto";
import { createId } from "@paralleldrive/cuid2";
import { createError } from "h3";
import type { EventSettings, Prisma } from "../prisma/generated/prisma/client";
import type { EventRolloverInput } from "../../shared/schemas/settings/rollover";
import type { EventArchiveSnapshot } from "../../shared/utils/eventArchives";
import { EVENT_SETTINGS_ID } from "../../shared/utils/settings";
import { GUESTS_BUCKET } from "../../shared/utils/guestsFiles";
import prisma from "./prisma";
import dayjs from "./dayjs";

type EventRolloverPreview = {
  event: Pick<EventSettings, "editionId" | "title" | "startDate" | "endDate" | "registrationsStartDate" | "registrationsEndDate">;
  snapshot: EventArchiveSnapshot;
  requests: number;
  paidCautions: number;
  emails: number;
  pendingCleanup: number;
  revision: string;
};

/** Builds the archive preview and a revision used to reject stale rollover confirmations. */
export async function getEventRolloverPreview(db: Prisma.TransactionClient = prisma): Promise<EventRolloverPreview> {
  const [event, participants, teams, guests, submissions, requests, paidCautions, emails, schedule, sponsors, pendingCleanup] = await Promise.all([
    db.eventSettings.findUniqueOrThrow({where: {id: EVENT_SETTINGS_ID}}),
    db.participant.count(),
    db.team.count(),
    // One guest record can represent several people.
    db.guest.aggregate({_sum: {quantity: true}}),
    db.submission.count(),
    db.submissionRequest.count(),
    db.participant.count({where: {caution: "PAID"}}),
    db.emailOutbox.count(),
    db.scheduleItem.findMany({
      select: {
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        icon: true,
        special: true,
      }, orderBy: [{startTime: "asc"}, {id: "asc"}],
    }),
    db.sponsor.findMany({
      select: {name: true, description: true, logo: true, url: true},
      orderBy: [{name: "asc"}, {id: "asc"}],
    }),
    db.supabaseCleanupJob.count({where: {scope: "ROLLOVER"}}),
  ]);

  // Participant and Guest records never enter the snapshot, because of privacy concerns.
  const snapshot = {
    slogan: event.slogan,
    locationName: event.locationName,
    locationAddress: event.locationAddress,
    logoPath: event.logoPath,
    counts: {participants, teams, guests: guests._sum.quantity ?? 0, submissions},
    schedule: schedule.map((item) => ({
      ...item,
      startTime: item.startTime.toISOString(),
      endTime: item.endTime.toISOString(),
    })),
    sponsors,
  } satisfies EventArchiveSnapshot;

  // Bind confirmation to the reviewed content and counts, including data that will be deleted.
  const revision = createHash("sha256").update(JSON.stringify({
    event,
    snapshot,
    requests,
    paidCautions,
    emails,
  })).digest("hex");

  return {
    event: {
      editionId: event.editionId,
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      registrationsStartDate: event.registrationsStartDate,
      registrationsEndDate: event.registrationsEndDate,
    },
    snapshot,
    requests,
    paidCautions,
    emails,
    pendingCleanup,
    revision,
  };
}

export async function rolloverEvent(input: EventRolloverInput) {
  return prisma.$transaction(async (db) => {
    const preview = await getEventRolloverPreview(db);
    if (preview.pendingCleanup) {
      throw createError({statusCode: 409, statusMessage: "Terminez le nettoyage de l'édition précédente."});
    }
    if (preview.event.editionId !== input.editionId || preview.revision !== input.revision) {
      throw createError({statusCode: 409, statusMessage: "Les données ont changé. Rechargez et vérifiez l'aperçu."});
    }
    if (input.confirmation !== preview.event.title) {
      throw createError({
        statusCode: 400,
        statusMessage: "Le titre de confirmation ne correspond pas à l'événement actuel.",
      });
    }
    if (preview.paidCautions) {
      throw createError({
        statusCode: 409,
        statusMessage: "Traitez les cautions encore payées avant de supprimer les participants.",
      });
    }
    if (await db.emailOutbox.count({where: {status: "PROCESSING"}})) {
      throw createError({statusCode: 409, statusMessage: "Un envoi d'email est en cours. Réessayez dans un instant."});
    }

    const startDate = dayjs.tz(input.startDate, "Europe/Brussels").toDate();
    if (startDate <= preview.event.endDate || startDate <= new Date()) {
      throw createError({
        statusCode: 400,
        statusMessage: "La nouvelle édition doit commencer dans le futur, après l'édition actuelle.",
      });
    }

    const [participants, files, guests] = await Promise.all([
      db.participant.findMany({
        select: {
          curriculumVitae: true,
          user: {select: {supabaseAuthId: true, admin: {select: {id: true}}}},
        },
      }),
      db.submissionFile.findMany({select: {bucket: true, path: true}}),
      db.guest.findMany({where: {imageUrl: {not: null}}, select: {imageUrl: true}}),
    ]);
    const cleanup: Prisma.SupabaseCleanupJobCreateManyInput[] = files.map((file) => ({
      type: "STORAGE_OBJECT",
      bucket: file.bucket,
      target: file.path,
    }));
    for (const participant of participants) {
      if (participant.curriculumVitae) cleanup.push({
        type: "STORAGE_OBJECT",
        bucket: "cvs",
        target: participant.curriculumVitae,
      });
      if (participant.user.supabaseAuthId && !participant.user.admin) cleanup.push({
        type: "AUTH_USER",
        target: participant.user.supabaseAuthId,
      });
    }
    for (const guest of guests) cleanup.push({type: "STORAGE_OBJECT", bucket: GUESTS_BUCKET, target: guest.imageUrl!});

    const archive = await db.eventArchive.create({
      data: {
        editionId: preview.event.editionId,
        title: preview.event.title,
        startDate: preview.event.startDate,
        endDate: preview.event.endDate,
        snapshot: preview.snapshot,
      },
    });
    if (cleanup.length) await db.supabaseCleanupJob.createMany({data: cleanup.map((job) => ({...job, scope: "ROLLOVER"}))});

    await db.emailOutbox.deleteMany();
    await db.submissionRequest.deleteMany();
    await db.user.deleteMany({where: {participant: {isNot: null}, admin: null}});
    // Preserve staff even if a legacy record also has a participant profile.
    await db.userRoleAssignment.deleteMany({where: {role: {key: "participant"}, user: {admin: {isNot: null}}}});
    await db.participant.deleteMany();
    await db.team.deleteMany();
    await db.guest.deleteMany();
    await db.sponsor.deleteMany();
    await db.scheduleItem.deleteMany();
    const updated = await db.eventSettings.updateMany({
      where: {id: EVENT_SETTINGS_ID, editionId: input.editionId}, data: {
        editionId: createId(), title: input.title, slogan: input.slogan, logoPath: null, teaserEnabled: true,
        startDate, endDate: dayjs.tz(input.endDate, "Europe/Brussels").toDate(),
        registrationsStartDate: dayjs.tz(input.registrationsStartDate, "Europe/Brussels").toDate(),
        registrationsEndDate: dayjs.tz(input.registrationsEndDate, "Europe/Brussels").toDate(),
        registrationMode: "CLOSED",
      },
    });
    if (!updated.count) {
      throw createError({statusCode: 409, statusMessage: "L'édition a déjà changé. Rechargez l'aperçu."});
    }

    return {archiveId: archive.id, pendingCleanup: cleanup.length};
  }, {isolationLevel: "Serializable", timeout: 30000})
    .catch((error: unknown) => {
      // Prisma error code P2034 is thrown when a transaction fails due to a serialization failure, which can happen
      // if the data has changed since the transaction started.
      if (error && typeof error === "object" && "code" in error && error.code === "P2034") {
        throw createError({statusCode: 409, statusMessage: "Les données ont changé. Rechargez et vérifiez l'aperçu."});
      }
      throw error;
    });
}
