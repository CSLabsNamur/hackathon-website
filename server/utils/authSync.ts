import { randomUUID } from "node:crypto";
import { createError } from "h3";
import { isAuthApiError, type SupabaseClient } from "@supabase/supabase-js";
import type { AuthSyncJob, Prisma } from "../prisma/generated/prisma/client";
import prisma from "./prisma";

const AUTH_SYNC_TIMEOUT_MS = 2 * 60 * 1000;

type AuthProfile = { firstName: string; lastName: string; email: string };

export async function prepareAuthSync(userId: string) {
  const user = await prisma.user.findUnique({where: {id: userId}, select: {supabaseAuthId: true}});
  if (!user) throw createError({statusCode: 404, statusMessage: "Utilisateur introuvable."});
  if (!user.supabaseAuthId) {
    throw createError({statusCode: 500, statusMessage: "Le compte d'authentification de l'utilisateur n'est pas lié."});
  }

  // One job per user prevents another edit while this request or its recovery is active.
  try {
    const job = await prisma.authSyncJob.create({
      data: {userId, lockToken: randomUUID(), lockedUntil: new Date(Date.now() + AUTH_SYNC_TIMEOUT_MS)},
    });
    return {...job, supabaseAuthId: user.supabaseAuthId};
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      throw createError({statusCode: 409, statusMessage: "La synchronisation de ce compte est en cours. Réessayez plus tard."});
    }
    throw error;
  }
}

export async function updateAuthProfile(supabase: SupabaseClient, supabaseAuthId: string, profile: AuthProfile) {
  const {error} = await supabase.auth.admin.updateUserById(supabaseAuthId, {
    email: profile.email,
    user_metadata: {firstName: profile.firstName, lastName: profile.lastName},
  });
  if (error) throw error;
}

export async function finishAuthSync(db: Prisma.TransactionClient, job: Pick<AuthSyncJob, "userId" | "lockToken">) {
  // Complete only our own job, before its recovery deadline. Call inside the profile's transaction.
  const completed = await db.authSyncJob.deleteMany({where: {userId: job.userId, lockToken: job.lockToken, lockedUntil: {gt: new Date()}}});
  if (!completed.count) {
    throw createError({statusCode: 409, statusMessage: "La synchronisation du compte a expiré. Réessayez plus tard."});
  }
}

export async function retryAuthSync(job: Pick<AuthSyncJob, "userId" | "lockToken">, error: unknown) {
  try {
    return await prisma.authSyncJob.updateMany({
      where: {userId: job.userId, lockToken: job.lockToken},
      data: {lockToken: null, lockedUntil: null, lastError: error instanceof Error ? error.message : String(error)},
    });
  } catch (recoveryError) {
    return console.error("Impossible de libérer la synchronisation Auth :", recoveryError);
  }
}

export async function processAuthSyncJobs(supabase: SupabaseClient) {
  let processed = 0;
  let failed = 0;
  const now = new Date();
  const jobs = await prisma.authSyncJob.findMany({
    where: {failed: false, scheduledAt: {lte: now}, OR: [{lockedUntil: null}, {lockedUntil: {lte: now}}]},
    orderBy: [{scheduledAt: "asc"}, {createdAt: "asc"}],
    take: 25,
  });

  for (const job of jobs) {
    const lockToken = randomUUID();
    const claimed = await prisma.authSyncJob.updateMany({
      where: {userId: job.userId, lockToken: job.lockToken, lockedUntil: job.lockedUntil, updatedAt: job.updatedAt},
      data: {lockToken, lockedUntil: new Date(Date.now() + AUTH_SYNC_TIMEOUT_MS), attempts: {increment: 1}},
    });
    if (!claimed.count) continue;

    try {
      // Read current committed values, never an old rollback snapshot.
      const user = await prisma.user.findUnique({where: {id: job.userId}});
      if (!user) continue; // Deleting a user also cancels its sync job.
      if (!user.supabaseAuthId) throw new Error("Le compte d'authentification de l'utilisateur n'est pas lié.");

      await updateAuthProfile(supabase, user.supabaseAuthId, user);
      const completed = await prisma.authSyncJob.deleteMany({where: {userId: job.userId, lockToken}});
      processed += completed.count;
    } catch (error) {
      const permanent = isAuthApiError(error)
        && ["email_exists", "user_not_found", "email_address_invalid", "validation_failed"].includes(error.code ?? "");
      const retryMinutes = Math.min(60, 2 ** Math.min(job.attempts, 6));
      await prisma.authSyncJob.updateMany({
        where: {userId: job.userId, lockToken},
        data: {
          lockToken: null,
          lockedUntil: null,
          failed: permanent,
          lastError: error instanceof Error ? error.message : String(error),
          scheduledAt: new Date(Date.now() + retryMinutes * 60 * 1000),
        },
      });
      if (permanent) console.error("La synchronisation Auth nécessite une intervention :", {userId: job.userId, error});
      failed++;
    }
  }

  return {processed, failed, pending: await prisma.authSyncJob.count()};
}
