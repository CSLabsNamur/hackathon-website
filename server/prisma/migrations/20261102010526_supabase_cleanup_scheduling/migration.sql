-- AlterTable
ALTER TABLE "SupabaseCleanupJob" ADD COLUMN     "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "SupabaseCleanupJob_scope_scheduledAt_createdAt_idx" ON "SupabaseCleanupJob"("scope", "scheduledAt", "createdAt");
