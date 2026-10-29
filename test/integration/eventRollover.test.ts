import { afterAll, beforeEach, describe, expect, it } from "vitest";
import prisma from "../../server/utils/prisma";
import { rolloverEvent } from "../../server/utils/eventArchives";
import { withEventTransaction } from "../../server/utils/eventEdition";
import {
  prepareRollover,
  resetEventDatabase,
  seedEventContent,
  seedParticipantData,
  seedReusableData,
} from "../fixtures/database";
import { currentEdition } from "../fixtures/event";

describe.skipIf(!process.env.TEST_DATABASE_URL)("event rollover", () => {
  beforeEach(resetEventDatabase);
  afterAll(() => prisma.$disconnect());

  it("archives event content and totals, removes personal data, and keeps reusable configuration", async () => {
    await seedReusableData();
    await seedParticipantData();
    await seedEventContent();

    const result = await rolloverEvent(await prepareRollover());

    const archive = await prisma.eventArchive.findUniqueOrThrow({where: {id: result.archiveId}});
    expect(archive.title).toBe(currentEdition.title);
    expect(archive.snapshot).toMatchObject({
      counts: {participants: 1, teams: 1, guests: 3, submissions: 1},
      logoPath: "logos/2026.png",
      schedule: [{title: "Accueil", description: "Ouverture"}],
      sponsors: [{name: "Sponsor", logo: "sponsor/logo.png"}],
    });
    expect(JSON.stringify(archive)).not.toMatch(/PRIVATE_|private@|participant-user|participant-auth|private-cv|private\.zip/);

    expect(await prisma.participant.count()).toBe(0);
    expect(await prisma.team.count()).toBe(0);
    expect(await prisma.guest.count()).toBe(0);
    expect(await prisma.submission.count()).toBe(0);
    expect(await prisma.submissionFile.count()).toBe(0);
    expect(await prisma.submissionRequest.count()).toBe(0);
    expect(await prisma.emailOutbox.count()).toBe(0);
    expect(await prisma.sponsor.count()).toBe(0);
    expect(await prisma.scheduleItem.count()).toBe(0);

    expect(await prisma.user.findMany({select: {id: true}})).toEqual([{id: "staff"}]);
    expect(await prisma.admin.count()).toBe(1);
    expect(await prisma.room.findFirstOrThrow()).toMatchObject({name: "Auditoire"});
    expect(await prisma.socialLink.findFirstOrThrow()).toMatchObject({type: "GITHUB"});
    expect(await prisma.websiteSettings.findFirstOrThrow()).toMatchObject({contactEmail: "event@cslabs.be"});
    expect(await prisma.role.count()).toBe(2);
    expect(await prisma.rolePermission.count()).toBe(1);
    expect(await prisma.userRoleAssignment.findFirstOrThrow()).toMatchObject({userId: "staff", roleId: "staff-role"});

    const settings = await prisma.eventSettings.findFirstOrThrow();
    expect(settings).toMatchObject({
      title: "Hackathon 2099",
      slogan: "",
      logoPath: null,
      registrationMode: "CLOSED",
      teaserEnabled: true,
      iban: "BE68539007547034",
      bic: "GKCCBEBB",
      cautionAmount: 30,
    });
    expect(settings.editionId).not.toBe(currentEdition.editionId);
    expect(settings.editionId).toMatch(/^[a-z][a-z0-9]{23}$/);
    expect(settings.startDate).toEqual(new Date("2099-10-23T08:00:00Z"));
    expect(result.pendingCleanup).toBe(4);
    expect(await prisma.supabaseCleanupJob.count({where: {scope: "ROLLOVER"}})).toBe(4);
    expect(await prisma.supabaseCleanupJob.findMany({
      select: {
        type: true,
        bucket: true,
        target: true,
      },
    })).toEqual(expect.arrayContaining([
      {type: "STORAGE_OBJECT", bucket: "cvs", target: "participant/private-cv.pdf"},
      {type: "STORAGE_OBJECT", bucket: "submissions", target: "participant/private.zip"},
      {type: "STORAGE_OBJECT", bucket: "guests", target: "guests/private.png"},
      {type: "AUTH_USER", bucket: null, target: "participant-auth"},
    ]));
  });

  it("requires a new preview when event content changes", async () => {
    await seedEventContent();
    const request = await prepareRollover();
    await prisma.sponsor.updateMany({data: {name: "Updated sponsor"}});

    await expect(rolloverEvent(request)).rejects.toMatchObject({statusCode: 409});

    expect(await prisma.eventArchive.count()).toBe(0);
    expect(await prisma.sponsor.findFirstOrThrow()).toMatchObject({name: "Updated sponsor"});
  });

  it("keeps participants when their deposits have not been settled", async () => {
    await seedParticipantData();
    await prisma.participant.updateMany({data: {caution: "PAID"}});

    await expect(rolloverEvent(await prepareRollover())).rejects.toMatchObject({statusCode: 409});

    expect(await prisma.participant.count()).toBe(1);
    expect(await prisma.eventArchive.count()).toBe(0);
    expect(await prisma.supabaseCleanupJob.count()).toBe(0);
  });

  it("waits until an email already being sent has finished", async () => {
    await prisma.emailOutbox.create({
      data: {
        type: "broadcast",
        recipient: "participant@example.test",
        subject: "News",
        html: "Hello",
        status: "PROCESSING",
      },
    });

    await expect(rolloverEvent(await prepareRollover())).rejects.toMatchObject({statusCode: 409});

    expect(await prisma.eventArchive.count()).toBe(0);
    expect(await prisma.emailOutbox.count()).toBe(1);
  });

  it("allows one rollover when two administrators confirm the same edition", async () => {
    const request = await prepareRollover();

    const results = await Promise.allSettled([rolloverEvent(request), rolloverEvent(request)]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(await prisma.eventArchive.count()).toBe(1);
  });

  it("rejects an upload that finishes after its edition has been archived", async () => {
    await rolloverEvent(await prepareRollover());

    const saveUpload = withEventTransaction(currentEdition.editionId, (db) => db.guest.create({
      data: {
        name: "Old guest",
        type: "GUEST",
        imageUrl: "old-upload.png",
      },
    }));

    await expect(saveUpload).rejects.toMatchObject({statusCode: 409});
    expect(await prisma.guest.count()).toBe(0);
  });

  it("rejects either the stale rollover preview or a simultaneous upload save", async () => {
    const request = await prepareRollover();

    const results = await Promise.allSettled([
      rolloverEvent(request),
      withEventTransaction(currentEdition.editionId, (db) => db.guest.create({
        data: {
          name: "New guest",
          type: "GUEST",
        },
      })),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    const archivedEditions = await prisma.eventArchive.count();
    const savedGuests = await prisma.guest.count();
    expect(archivedEditions + savedGuests).toBe(1);
  });

  it("rolls back the archive, deletions and cleanup queue if preparing the next edition fails", async () => {
    await seedParticipantData();
    const request = await prepareRollover();
    // Fail while preparing the final settings update, after the deletions have run.
    request.endDate = "invalid date";

    await expect(rolloverEvent(request)).rejects.toThrow();

    expect(await prisma.eventArchive.count()).toBe(0);
    expect(await prisma.supabaseCleanupJob.count()).toBe(0);
    expect(await prisma.participant.count()).toBe(1);
    expect(await prisma.submissionFile.count()).toBe(1);
    expect(await prisma.emailOutbox.count()).toBe(1);
    expect(await prisma.eventSettings.findFirstOrThrow()).toMatchObject({
      editionId: currentEdition.editionId,
      title: currentEdition.title,
    });
  });
});
