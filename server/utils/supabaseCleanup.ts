import type { SupabaseClient } from "@supabase/supabase-js";
import { createError } from "h3";
import type { Prisma, SupabaseCleanupJobScope } from "../prisma/generated/prisma/client";
import prisma from "./prisma";

const SUPABASE_CREATION_TIMEOUT_MS = 15 * 60 * 1000;

export function prepareSupabaseCreation(data: Pick<Prisma.SupabaseCleanupJobCreateInput, "type" | "target" | "bucket">) {
  // Record the exact external target before creating it, even if the response is lost.
  return prisma.supabaseCleanupJob.create({data: {...data, scheduledAt: new Date(Date.now() + SUPABASE_CREATION_TIMEOUT_MS)}});
}

export async function finishSupabaseCreation(db: Prisma.TransactionClient, cleanupJobIds: string[]) {
  // Link resources and remove their jobs together, only if cleanup has never started.
  const completed = await db.supabaseCleanupJob.deleteMany({where: {id: {in: cleanupJobIds}, attempts: 0, scheduledAt: {gt: new Date()}}});
  if (completed.count !== cleanupJobIds.length) {
    throw createError({statusCode: 409, statusMessage: "La création du compte a expiré. Réessayez plus tard."});
  }
}

export function retrySupabaseCleanup(cleanupJobIds: string[]) {
  // A late creation failure must not reset a cleanup worker's retry schedule.
  return prisma.supabaseCleanupJob.updateMany({where: {id: {in: cleanupJobIds}, attempts: 0}, data: {scheduledAt: new Date()}});
}

export async function processSupabaseCleanup(supabase: SupabaseClient, scope?: SupabaseCleanupJobScope) {
  let failed = 0;
  let processed = 0;

  const jobs = await prisma.supabaseCleanupJob.findMany({where: {scope, scheduledAt: {lte: new Date()}}, take: 25, orderBy: [{scheduledAt: "asc"}, {createdAt: "asc"}, {id: "asc"}]});

  for (const job of jobs) {
    const retryMinutes = Math.min(60, 2 ** Math.min(job.attempts, 6));
    // Claim before deleting external resources. This waits for any creation transaction to finish.
    // Schedule retries now so failures and crashes leave room for later jobs in the next batch.
    const claimed = await prisma.supabaseCleanupJob.updateMany({
      where: {id: job.id, attempts: job.attempts, scheduledAt: job.scheduledAt},
      data: {attempts: {increment: 1}, scheduledAt: new Date(Date.now() + retryMinutes * 60 * 1000)},
    });
    if (!claimed.count) continue;

    try {
      let result;
      switch (job.type) {
        case "STORAGE_OBJECT":
          if (!job.bucket) throw new Error("Storage cleanup requires a bucket.");
          result = await supabase.storage.from(job.bucket).remove([job.target]);
          break;
        case "AUTH_USER":
          // Never remove an Auth account which a completed local account still owns.
          if (await prisma.user.count({where: {supabaseAuthId: job.target}})) {
            processed += (await prisma.supabaseCleanupJob.deleteMany({where: {id: job.id, attempts: job.attempts + 1}})).count;
            continue;
          }
          result = await supabase.auth.admin.deleteUser(job.target);
          break;
        default:
          throw new Error(`Unsupported cleanup job type: ${job.type}`);
      }
      const {error} = result;

      if (error && !(job.type === "AUTH_USER" && "code" in error && error.code === "user_not_found")) {
        failed++;
        continue;
      }

      const deleted = await prisma.supabaseCleanupJob.deleteMany({where: {id: job.id, attempts: job.attempts + 1}});
      processed += deleted.count;
    } catch {
      failed++;
    }
  }
  return {processed, failed, pending: await prisma.supabaseCleanupJob.count({where: {scope}})};
}
