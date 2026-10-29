import type { SupabaseClient } from "@supabase/supabase-js";
import type { SupabaseCleanupJobScope } from "../prisma/generated/prisma/client";
import prisma from "./prisma";

export async function processSupabaseCleanup(supabase: SupabaseClient, scope?: SupabaseCleanupJobScope) {
  let failed = 0;
  let processed = 0;

  const jobs = await prisma.supabaseCleanupJob.findMany({where: {scope}, take: 25, orderBy: [{createdAt: "asc"}, {id: "asc"}]});

  for (const job of jobs) {
    try {
      let result;
      switch (job.type) {
        case "STORAGE_OBJECT":
          if (!job.bucket) throw new Error("Storage cleanup requires a bucket.");
          result = await supabase.storage.from(job.bucket).remove([job.target]);
          break;
        case "AUTH_USER":
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

      const deleted = await prisma.supabaseCleanupJob.deleteMany({where: {id: job.id}});
      processed += deleted.count;
    } catch {
      failed++;
    }
  }
  return {processed, failed, pending: await prisma.supabaseCleanupJob.count({where: {scope}})};
}
