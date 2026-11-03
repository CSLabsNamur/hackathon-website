import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthApiError, createClient } from "@supabase/supabase-js";
import prisma from "../../server/utils/prisma";
import { finishSupabaseCreation, prepareSupabaseCreation, processSupabaseCleanup, retrySupabaseCleanup } from "../../server/utils/supabaseCleanup";
import { prepareRollover, resetEventDatabase } from "../fixtures/database";
import { rolloverEvent } from "../../server/utils/eventArchives";
import { withEventTransaction } from "../../server/utils/eventEdition";
import { currentEdition } from "../fixtures/event";

describe.skipIf(!process.env.TEST_DATABASE_URL)("durable account creation", () => {
  const supabase = createClient("https://supabase.example.test", "test-key");
  const removeAuth = vi.spyOn(supabase.auth.admin, "deleteUser");
  beforeEach(async () => {
    await resetEventDatabase();
    removeAuth.mockReset().mockResolvedValue({data: {user: null}, error: null});
  });
  afterAll(() => prisma.$disconnect());

  it("records the Auth ID before creation and defers cleanup until the request expires", async () => {
    const job = await prepareSupabaseCreation({type: "AUTH_USER", target: "preallocated-auth-id"});
    expect(await processSupabaseCleanup(supabase)).toMatchObject({processed: 0, pending: 1});
    expect(removeAuth).not.toHaveBeenCalled();
    await prisma.supabaseCleanupJob.update({where: {id: job.id}, data: {scheduledAt: new Date(0)}});
    expect(await processSupabaseCleanup(supabase)).toMatchObject({processed: 1, pending: 0});
    expect(removeAuth).toHaveBeenCalledWith("preallocated-auth-id");
  });

  it("commits the account, email, and removal of recovery together", async () => {
    const job = await prepareSupabaseCreation({type: "AUTH_USER", target: "auth-id"});
    await prisma.$transaction(async (db) => {
      await finishSupabaseCreation(db, [job.id]);
      await db.user.create({data: {email: "admin@cslabs.be", firstName: "Admin", lastName: "User", supabaseAuthId: "auth-id", admin: {create: {}}}});
      await db.emailOutbox.create({data: {type: "admin_invite", recipient: "admin@cslabs.be", subject: "Invitation", html: "Welcome"}});
    });
    expect(await prisma.admin.count()).toBe(1);
    expect(await prisma.emailOutbox.count()).toBe(1);
    expect(await prisma.supabaseCleanupJob.count()).toBe(0);
  });

  it("keeps recovery and rolls back the local account if enqueueing its email fails", async () => {
    const job = await prepareSupabaseCreation({type: "AUTH_USER", target: "auth-id"});
    await expect(prisma.$transaction(async (db) => {
      await finishSupabaseCreation(db, [job.id]);
      await db.user.create({data: {email: "admin@cslabs.be", firstName: "Admin", lastName: "User", supabaseAuthId: "auth-id", admin: {create: {}}}});
      throw new Error("Email enqueue failed");
    })).rejects.toThrow("Email enqueue failed");
    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.supabaseCleanupJob.count()).toBe(1);
    await retrySupabaseCleanup([job.id]);
    removeAuth.mockRejectedValue(new Error("Auth unavailable"));
    expect(await processSupabaseCleanup(supabase)).toMatchObject({failed: 1, pending: 1});
  });

  it("rejects late linking after its cleanup deadline", async () => {
    const job = await prepareSupabaseCreation({type: "AUTH_USER", target: "auth-id"});
    await prisma.supabaseCleanupJob.update({where: {id: job.id}, data: {scheduledAt: new Date(0)}});
    await expect(prisma.$transaction((db) => finishSupabaseCreation(db, [job.id]))).rejects.toMatchObject({statusCode: 409});
    expect(await prisma.supabaseCleanupJob.count()).toBe(1);
  });

  it("never deletes an Auth account that is already linked to a local user", async () => {
    await prisma.user.create({data: {email: "linked@cslabs.be", firstName: "Linked", lastName: "User", supabaseAuthId: "linked-auth"}});
    await prisma.supabaseCleanupJob.create({data: {type: "AUTH_USER", target: "linked-auth"}});
    expect(await processSupabaseCleanup(supabase)).toMatchObject({processed: 1});
    expect(removeAuth).not.toHaveBeenCalled();
  });

  it("accepts an absent Auth account when the request crashed before creating it", async () => {
    const job = await prepareSupabaseCreation({type: "AUTH_USER", target: "never-created"});
    await retrySupabaseCleanup([job.id]);
    removeAuth.mockResolvedValue({data: {user: null}, error: new AuthApiError("User not found", 404, "user_not_found")});
    expect(await processSupabaseCleanup(supabase)).toMatchObject({processed: 1, failed: 0});
  });

  it("retains Auth cleanup when registration email enqueueing rolls back", async () => {
    const authJob = await prepareSupabaseCreation({type: "AUTH_USER", target: "registration-auth"});
    await expect(withEventTransaction(currentEdition.editionId, async (db) => {
      await finishSupabaseCreation(db, [authJob.id]);
      await db.participant.create({data: {
        id: "participant", imageAgreement: true,
        user: {create: {email: "participant@example.test", firstName: "Test", lastName: "Participant", supabaseAuthId: "registration-auth"}},
      }});
      throw new Error("Email enqueue failed");
    })).rejects.toThrow("Email enqueue failed");
    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.participant.count()).toBe(0);
    expect(await prisma.supabaseCleanupJob.count()).toBe(1);

    await retrySupabaseCleanup([authJob.id]);
    expect(await processSupabaseCleanup(supabase)).toMatchObject({processed: 1, pending: 0});
    expect(removeAuth).toHaveBeenCalledWith("registration-auth");
  });

  it("does not commit a registration after rollover while its Auth account was being created", async () => {
    const authJob = await prepareSupabaseCreation({type: "AUTH_USER", target: "late-auth"});
    await rolloverEvent(await prepareRollover());
    await expect(withEventTransaction(currentEdition.editionId, (db) => finishSupabaseCreation(db, [authJob.id]))).rejects.toMatchObject({statusCode: 409});
    expect(await prisma.participant.count()).toBe(0);
    expect(await prisma.supabaseCleanupJob.count({where: {scope: "GENERAL"}})).toBe(1);
  });

  it("keeps every recovery record if one external resource has expired before finalization", async () => {
    const authJob = await prepareSupabaseCreation({type: "AUTH_USER", target: "auth-id"});
    const fileJob = await prepareSupabaseCreation({type: "STORAGE_OBJECT", bucket: "submissions", target: "participant/file.pdf"});
    await prisma.supabaseCleanupJob.update({where: {id: fileJob.id}, data: {scheduledAt: new Date(0)}});
    await expect(prisma.$transaction((db) => finishSupabaseCreation(db, [authJob.id, fileJob.id]))).rejects.toMatchObject({statusCode: 409});
    expect(await prisma.supabaseCleanupJob.count()).toBe(2);
  });
});
