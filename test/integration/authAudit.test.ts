import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthApiError, createClient } from "@supabase/supabase-js";
import prisma from "../../server/utils/prisma";
import { prepareAuthSync, processAuthSyncJobs, retryAuthSync, updateAuthProfile } from "../../server/utils/authSync";
import { finishSupabaseCreation, prepareSupabaseCreation, processSupabaseCleanup, retrySupabaseCleanup } from "../../server/utils/supabaseCleanup";
import { resetEventDatabase } from "../fixtures/database";

describe.skipIf(!process.env.TEST_DATABASE_URL)("Auth durability audit reproductions", () => {
  const supabase = createClient("https://supabase.example.test", "test-key");
  const updateAuth = vi.spyOn(supabase.auth.admin, "updateUserById");
  const deleteAuth = vi.spyOn(supabase.auth.admin, "deleteUser");

  beforeEach(async () => {
    await resetEventDatabase();
    updateAuth.mockReset().mockResolvedValue({data: {user: null}, error: null});
    deleteAuth.mockReset().mockResolvedValue({data: {user: null}, error: null});
  });
  afterAll(() => prisma.$disconnect());

  it("preserves Auth while a valid finalization transaction crosses the cleanup deadline", async () => {
    const job = await prepareSupabaseCreation({type: "AUTH_USER", target: "crossing-deadline"});
    const deadline = Date.now() + 500;
    await prisma.supabaseCleanupJob.update({where: {id: job.id}, data: {scheduledAt: new Date(deadline)}});
    let ready!: () => void;
    let release!: () => void;
    let selected!: () => void;
    const transactionReady = new Promise<void>((resolve) => { ready = resolve; });
    const finishTransaction = new Promise<void>((resolve) => { release = resolve; });
    const jobSelected = new Promise<void>((resolve) => { selected = resolve; });
    let authExists = true;
    deleteAuth.mockImplementation(async () => {
      authExists = false;
      return {data: {user: null}, error: null};
    });
    const transaction = prisma.$transaction(async (db) => {
      await finishSupabaseCreation(db, [job.id]);
      ready();
      await finishTransaction;
      return db.user.create({data: {email: "deadline@example.test", firstName: "Test", lastName: "User", supabaseAuthId: job.target}});
    });
    await transactionReady;
    await new Promise((resolve) => setTimeout(resolve, Math.max(0, deadline - Date.now() + 20)));
    const findJobs = prisma.supabaseCleanupJob.findMany.bind(prisma.supabaseCleanupJob);
    const selection = vi.spyOn(prisma.supabaseCleanupJob, "findMany").mockImplementationOnce(async (args) => {
      const jobs = await findJobs(args);
      expect(jobs.map((pending) => pending.id)).toContain(job.id);
      selected();
      return jobs;
    });
    const worker = processSupabaseCleanup(supabase);
    try {
      await jobSelected;
      await new Promise((resolve) => setTimeout(resolve, 100));
    } finally {
      release();
      selection.mockRestore();
    }
    await transaction;
    await worker;
    expect(await prisma.user.count({where: {supabaseAuthId: job.target}})).toBe(1);
    expect(authExists).toBe(true);
    expect(deleteAuth).not.toHaveBeenCalled();
    expect(await prisma.supabaseCleanupJob.count()).toBe(0);
  });

  it("backs off failed cleanup jobs so later jobs can be processed", async () => {
    await prisma.supabaseCleanupJob.createMany({data: Array.from({length: 26}, (_, index) => ({
      id: `cleanup-${String(index).padStart(2, "0")}`, type: "AUTH_USER" as const,
      target: `auth-${index}`, scheduledAt: new Date(index), createdAt: new Date(index),
    }))});
    deleteAuth.mockImplementation(async (id) => ({data: {user: null}, error: id === "auth-25" ? null : new AuthApiError("Unavailable", 503, "unexpected_failure")}));
    expect(await processSupabaseCleanup(supabase)).toMatchObject({failed: 25, pending: 26});
    expect(await processSupabaseCleanup(supabase)).toMatchObject({processed: 1, failed: 0, pending: 25});
    expect(deleteAuth).toHaveBeenCalledTimes(26);
    expect(deleteAuth).toHaveBeenCalledWith("auth-25");
  });

  it("rejects creation finalization while its failed cleanup is scheduled for retry", async () => {
    const job = await prepareSupabaseCreation({type: "AUTH_USER", target: "already-cleaning"});
    await prisma.supabaseCleanupJob.update({where: {id: job.id}, data: {scheduledAt: new Date(0)}});
    deleteAuth.mockRejectedValue(new Error("Auth unavailable"));
    expect(await processSupabaseCleanup(supabase)).toMatchObject({failed: 1, pending: 1});
    const pending = await prisma.supabaseCleanupJob.findUniqueOrThrow({where: {id: job.id}});
    expect(pending.scheduledAt.getTime()).toBeGreaterThan(Date.now());
    await expect(prisma.$transaction((db) => finishSupabaseCreation(db, [job.id]))).rejects.toMatchObject({statusCode: 409});
    expect(await prisma.supabaseCleanupJob.count()).toBe(1);
  });

  it("keeps an active cleanup's schedule when its creation request fails late", async () => {
    const job = await prepareSupabaseCreation({type: "AUTH_USER", target: "active-cleanup"});
    await retrySupabaseCleanup([job.id]);
    let started!: () => void;
    let release!: () => void;
    const cleanupStarted = new Promise<void>((resolve) => { started = resolve; });
    const finishCleanup = new Promise<void>((resolve) => { release = resolve; });
    deleteAuth.mockImplementation(async () => {
      started();
      await finishCleanup;
      return {data: {user: null}, error: null};
    });
    const worker = processSupabaseCleanup(supabase);
    await cleanupStarted;
    try {
      const active = await prisma.supabaseCleanupJob.findUniqueOrThrow({where: {id: job.id}});
      expect(active.attempts).toBe(1);
      await retrySupabaseCleanup([job.id]);
      expect((await prisma.supabaseCleanupJob.findUniqueOrThrow({where: {id: job.id}})).scheduledAt).toEqual(active.scheduledAt);
      await expect(prisma.$transaction((db) => finishSupabaseCreation(db, [job.id]))).rejects.toMatchObject({statusCode: 409});
      expect(await processSupabaseCleanup(supabase)).toMatchObject({processed: 0, failed: 0, pending: 1});
    } finally {
      release();
      await worker;
    }
    expect(deleteAuth).toHaveBeenCalledTimes(1);
    expect(await prisma.supabaseCleanupJob.count()).toBe(0);
  });

  it("does not let an older cleanup worker remove a newer failed attempt", async () => {
    const job = await prisma.supabaseCleanupJob.create({data: {type: "AUTH_USER", target: "retried-cleanup"}});
    let started!: () => void;
    let release!: () => void;
    const cleanupStarted = new Promise<void>((resolve) => { started = resolve; });
    const finishCleanup = new Promise<void>((resolve) => { release = resolve; });
    deleteAuth.mockImplementationOnce(async () => {
      started();
      await finishCleanup;
      return {data: {user: null}, error: null};
    }).mockRejectedValueOnce(new Error("Auth unavailable"));
    const oldWorker = processSupabaseCleanup(supabase);
    await cleanupStarted;
    try {
      await prisma.supabaseCleanupJob.update({where: {id: job.id}, data: {scheduledAt: new Date(0)}});
      expect(await processSupabaseCleanup(supabase)).toMatchObject({failed: 1, pending: 1});
    } finally {
      release();
      await oldWorker;
    }
    expect(await prisma.supabaseCleanupJob.findUniqueOrThrow({where: {id: job.id}})).toMatchObject({attempts: 2});
    expect(deleteAuth).toHaveBeenCalledTimes(2);
  });

  it("loses recovery if a remote profile mutation commits after the timed-out call was compensated", async () => {
    const oldProfile = {email: "old@example.test", firstName: "Old", lastName: "Name"};
    const newProfile = {...oldProfile, firstName: "New"};
    await prisma.user.create({data: {...oldProfile, id: "staff", supabaseAuthId: "staff-auth"}});
    let remoteProfile = {...oldProfile};
    // Model a server operation continuing after the caller loses its connection.
    const completeOriginalRemoteWrite = () => { remoteProfile = {...newProfile}; };
    updateAuth.mockRejectedValueOnce(new Error("Request timed out"));
    const job = await prepareAuthSync("staff");
    await expect(updateAuthProfile(supabase, job.supabaseAuthId, newProfile)).rejects.toThrow("Request timed out");
    await retryAuthSync(job, new Error("Request timed out"));
    updateAuth.mockImplementation(async (_id, attributes) => {
      remoteProfile = {email: attributes.email!, firstName: attributes.user_metadata!.firstName, lastName: attributes.user_metadata!.lastName};
      return {data: {user: null}, error: null};
    });
    expect(await processAuthSyncJobs(supabase)).toMatchObject({processed: 1, pending: 0});
    completeOriginalRemoteWrite();
    expect(remoteProfile.firstName).toBe("New");
    expect((await prisma.user.findUniqueOrThrow({where: {id: "staff"}})).firstName).toBe("Old");
    expect(await prisma.authSyncJob.count()).toBe(0);
  });

  it("loses cleanup if a remote creation commits after a timeout and an absent-account cleanup", async () => {
    const job = await prepareSupabaseCreation({type: "AUTH_USER", target: "late-created"});
    let remoteExists = false;
    const completeOriginalRemoteCreation = () => { remoteExists = true; };
    await retrySupabaseCleanup([job.id]);
    deleteAuth.mockResolvedValue({data: {user: null}, error: new AuthApiError("User not found", 404, "user_not_found")});
    expect(await processSupabaseCleanup(supabase)).toMatchObject({processed: 1, pending: 0});
    expect(remoteExists).toBe(false);
    completeOriginalRemoteCreation();
    expect(remoteExists).toBe(true);
    expect(await prisma.user.count()).toBe(0);
    expect(await prisma.supabaseCleanupJob.count()).toBe(0);
  });
});
