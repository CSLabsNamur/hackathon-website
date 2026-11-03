import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthApiError, createClient } from "@supabase/supabase-js";
import prisma from "../../server/utils/prisma";
import { finishAuthSync, prepareAuthSync, processAuthSyncJobs, retryAuthSync, updateAuthProfile } from "../../server/utils/authSync";
import { resetEventDatabase } from "../fixtures/database";

describe.skipIf(!process.env.TEST_DATABASE_URL)("durable Auth synchronization", () => {
  const supabase = createClient("https://supabase.example.test", "test-key");
  const updateAuth = vi.spyOn(supabase.auth.admin, "updateUserById");

  beforeEach(async () => {
    await resetEventDatabase();
    updateAuth.mockReset().mockResolvedValue({data: {user: null}, error: null});
    await prisma.user.create({data: {id: "staff", supabaseAuthId: "staff-auth", email: "old@cslabs.be", firstName: "Old", lastName: "Name"}});
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  const profile = {email: "new@cslabs.be", firstName: "New", lastName: "Name"};
  it("commits the profile and removes its recovery record together", async () => {
    const job = await prepareAuthSync("staff");
    await updateAuthProfile(supabase, job.supabaseAuthId, profile);
    const user = await prisma.$transaction(async (db) => {
      await finishAuthSync(db, job);
      return db.user.update({where: {id: "staff"}, data: profile});
    });
    expect(user).toMatchObject(profile);
    expect(updateAuth).toHaveBeenCalledWith("staff-auth", {email: profile.email, user_metadata: {firstName: "New", lastName: "Name"}});
    expect(await prisma.authSyncJob.count()).toBe(0);
  });

  it("retains recovery and the original local profile when the database write fails", async () => {
    const job = await prepareAuthSync("staff");
    await updateAuthProfile(supabase, job.supabaseAuthId, profile);
    await expect(prisma.$transaction(async (db) => {
      await finishAuthSync(db, job);
      await db.user.update({where: {id: "staff"}, data: profile});
      throw new Error("Database write failed");
    })).rejects.toThrow("Database write failed");
    await retryAuthSync(job, new Error("Database write failed"));
    expect(await prisma.user.findUniqueOrThrow({where: {id: "staff"}})).toMatchObject({email: "old@cslabs.be", firstName: "Old"});
    expect(await prisma.authSyncJob.findUniqueOrThrow({where: {userId: "staff"}})).toMatchObject({lockToken: null, lockedUntil: null});
  });

  it("retains recovery when Auth rejects or loses the response", async () => {
    updateAuth.mockRejectedValue(new Error("Auth unavailable"));
    const job = await prepareAuthSync("staff");
    await expect(updateAuthProfile(supabase, job.supabaseAuthId, profile)).rejects.toThrow("Auth unavailable");
    await retryAuthSync(job, new Error("Auth unavailable"));
    expect(await prisma.user.findUniqueOrThrow({where: {id: "staff"}})).toMatchObject({email: "old@cslabs.be"});
    expect(await prisma.authSyncJob.count()).toBe(1);
  });

  it("blocks another profile edit while recovery is outstanding", async () => {
    await prisma.authSyncJob.create({data: {userId: "staff"}});
    await expect(prepareAuthSync("staff")).rejects.toMatchObject({statusCode: 409});
    expect(updateAuth).not.toHaveBeenCalled();
  });

  it("restores current database values after a crashed request and skips active edits", async () => {
    await prisma.authSyncJob.create({data: {userId: "staff", lockToken: "request", lockedUntil: new Date(Date.now() + 60000)}});
    expect(await processAuthSyncJobs(supabase)).toMatchObject({processed: 0});
    await prisma.authSyncJob.update({where: {userId: "staff"}, data: {lockedUntil: new Date(0)}});
    await prisma.user.update({where: {id: "staff"}, data: {firstName: "Current"}});
    expect(await processAuthSyncJobs(supabase)).toEqual({processed: 1, failed: 0, pending: 0});
    expect(updateAuth).toHaveBeenCalledWith("staff-auth", {email: "old@cslabs.be", user_metadata: {firstName: "Current", lastName: "Name"}});
  });

  it("lets only one worker process the same job", async () => {
    await prisma.authSyncJob.create({data: {userId: "staff"}});
    const results = await Promise.all([processAuthSyncJobs(supabase), processAuthSyncJobs(supabase)]);
    expect(results.reduce((count, result) => count + result.processed, 0)).toBe(1);
    expect(updateAuth).toHaveBeenCalledTimes(1);
  });

  it("retains temporary failures with backoff and permanent errors for intervention", async () => {
    await prisma.authSyncJob.create({data: {userId: "staff"}});
    updateAuth.mockRejectedValue(new Error("Network unavailable"));
    expect(await processAuthSyncJobs(supabase)).toMatchObject({failed: 1, pending: 1});
    expect(await prisma.authSyncJob.findUniqueOrThrow({where: {userId: "staff"}})).toMatchObject({attempts: 1, failed: false, lockToken: null});
    expect(await processAuthSyncJobs(supabase)).toMatchObject({failed: 0});
    await prisma.authSyncJob.update({where: {userId: "staff"}, data: {scheduledAt: new Date(0)}});
    updateAuth.mockResolvedValue({data: {user: null}, error: new AuthApiError("Email already exists", 422, "email_exists")});
    expect(await processAuthSyncJobs(supabase)).toMatchObject({failed: 1});
    expect(await prisma.authSyncJob.findUniqueOrThrow({where: {userId: "staff"}})).toMatchObject({failed: true, lastError: "Email already exists"});
  });

  it("rejects a late request's commit after its lease expires", async () => {
    updateAuth.mockImplementation(async () => {
      await prisma.authSyncJob.update({where: {userId: "staff"}, data: {lockedUntil: new Date(0)}});
      return {data: {user: null}, error: null};
    });
    const job = await prepareAuthSync("staff");
    await updateAuthProfile(supabase, job.supabaseAuthId, profile);
    await expect(prisma.$transaction(async (db) => {
      await finishAuthSync(db, job);
      return db.user.update({where: {id: "staff"}, data: profile});
    })).rejects.toMatchObject({statusCode: 409});
    expect(await prisma.user.findUniqueOrThrow({where: {id: "staff"}})).toMatchObject({firstName: "Old"});
    expect(await prisma.authSyncJob.count()).toBe(1);
  });

  it("prevents an old request from completing or releasing a job taken over by recovery", async () => {
    const job = await prepareAuthSync("staff");
    await prisma.authSyncJob.update({where: {userId: "staff"}, data: {lockToken: "recovery-worker"}});
    await expect(prisma.$transaction((db) => finishAuthSync(db, job))).rejects.toMatchObject({statusCode: 409});
    await retryAuthSync(job, new Error("Old request failed"));
    expect(await prisma.authSyncJob.findUniqueOrThrow({where: {userId: "staff"}})).toMatchObject({lockToken: "recovery-worker"});
  });
});
