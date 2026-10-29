import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthApiError, createClient } from "@supabase/supabase-js";
import prisma from "../../server/utils/prisma";
import { processSupabaseCleanup } from "../../server/utils/supabaseCleanup";
import { withEventTransaction } from "../../server/utils/eventEdition";
import { getEventRolloverPreview, rolloverEvent } from "../../server/utils/eventArchives";
import { prepareRollover, resetEventDatabase } from "../fixtures/database";
import { currentEdition } from "../fixtures/event";

describe.skipIf(!process.env.TEST_DATABASE_URL)("Supabase cleanup", () => {
  beforeEach(resetEventDatabase);
  afterAll(() => prisma.$disconnect());

  it("retries rollover deletions independently of general cleanup and accepts an already deleted account", async () => {
    await prisma.supabaseCleanupJob.createMany({
      data: [
        {type: "STORAGE_OBJECT", scope: "ROLLOVER", bucket: "cvs", target: "participant/cv.pdf"},
        {type: "AUTH_USER", scope: "ROLLOVER", target: "participant-auth"},
        {type: "STORAGE_OBJECT", bucket: "cvs", target: "abandoned-cv.pdf"},
      ],
    });

    const supabase = createClient("https://supabase-example.cslabs.be", "test-key");
    const bucket = supabase.storage.from("cvs");

    vi.spyOn(supabase.storage, "from").mockReturnValue(bucket);

    const removeFile = vi.spyOn(bucket, "remove").mockRejectedValue(new Error("Storage unavailable"));
    const deleteUser = vi.spyOn(supabase.auth.admin, "deleteUser").mockRejectedValue(new Error("Auth unavailable"));

    expect(await processSupabaseCleanup(supabase, "ROLLOVER")).toEqual({processed: 0, failed: 2, pending: 2});
    expect((await getEventRolloverPreview()).pendingCleanup).toBe(2);
    await expect(withEventTransaction(currentEdition.editionId, (db) => db.eventSettings.updateMany({data: {registrationMode: "OPEN"}}))).rejects.toMatchObject({statusCode: 503});

    removeFile.mockResolvedValue({data: [], error: null});
    deleteUser.mockResolvedValue({
      data: {user: null},
      error: new AuthApiError("User not found", 404, "user_not_found"),
    });

    expect(await processSupabaseCleanup(supabase, "ROLLOVER")).toEqual({processed: 2, failed: 0, pending: 0});
    expect(removeFile).toHaveBeenCalledWith(["participant/cv.pdf"]);
    expect(deleteUser).toHaveBeenCalledWith("participant-auth");
    expect(removeFile).not.toHaveBeenCalledWith(["abandoned-cv.pdf"]);
    expect(await prisma.supabaseCleanupJob.count()).toBe(1);
    expect((await getEventRolloverPreview()).pendingCleanup).toBe(0);
    await expect(withEventTransaction(currentEdition.editionId, (db) => db.eventSettings.updateMany({data: {registrationMode: "OPEN"}}))).resolves.toMatchObject({count: 1});

    expect(await processSupabaseCleanup(supabase)).toEqual({processed: 1, failed: 0, pending: 0});
    expect(removeFile).toHaveBeenCalledWith(["abandoned-cv.pdf"]);
    expect(await prisma.supabaseCleanupJob.count()).toBe(0);
  });

  it("allows event writes and rollover while a general deletion is failing", async () => {
    await prisma.supabaseCleanupJob.create({
      data: {
        type: "STORAGE_OBJECT",
        bucket: "sponsors",
        target: "abandoned-logo.png",
      },
    });

    const supabase = createClient("https://supabase-example.cslabs.be", "test-key");
    const bucket = supabase.storage.from("sponsors");

    vi.spyOn(supabase.storage, "from").mockReturnValue(bucket);
    vi.spyOn(bucket, "remove").mockRejectedValue(new Error("Storage unavailable"));

    expect(await processSupabaseCleanup(supabase)).toEqual({processed: 0, failed: 1, pending: 1});
    await expect(withEventTransaction(currentEdition.editionId, (db) => db.eventSettings.updateMany({data: {registrationMode: "OPEN"}}))).resolves.toMatchObject({count: 1});
    expect((await getEventRolloverPreview()).pendingCleanup).toBe(0);

    const result = await rolloverEvent(await prepareRollover());

    expect(result.pendingCleanup).toBe(0);
    expect(await prisma.eventArchive.count()).toBe(1);
    expect(await prisma.supabaseCleanupJob.findFirstOrThrow()).toMatchObject({
      scope: "GENERAL",
      target: "abandoned-logo.png",
    });
  });

  it("allows the scheduled worker and an administrator to retry the same deletion", async () => {
    await prisma.supabaseCleanupJob.create({
      data: {
        type: "STORAGE_OBJECT",
        scope: "ROLLOVER",
        bucket: "cvs",
        target: "participant/cv.pdf",
      },
    });

    const supabase = createClient("https://supabase-example.cslabs.be", "test-key");
    const bucket = supabase.storage.from("cvs");

    vi.spyOn(supabase.storage, "from").mockReturnValue(bucket);
    vi.spyOn(bucket, "remove").mockResolvedValue({data: [], error: null});

    const results = await Promise.all([processSupabaseCleanup(supabase), processSupabaseCleanup(supabase, "ROLLOVER")]);

    expect(results.every((result) => result.failed === 0)).toBe(true);
    expect(results.reduce((total, result) => total + result.processed, 0)).toBe(1);
    expect(await prisma.supabaseCleanupJob.count()).toBe(0);
  });
});
