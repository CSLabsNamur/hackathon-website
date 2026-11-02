-- CreateTable
CREATE TABLE "AuthSyncJob" (
    "userId" TEXT NOT NULL,
    "lockToken" TEXT,
    "lockedUntil" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "failed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthSyncJob_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "AuthSyncJob_failed_scheduledAt_idx" ON "AuthSyncJob"("failed", "scheduledAt");

-- AddForeignKey
ALTER TABLE "AuthSyncJob" ADD CONSTRAINT "AuthSyncJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
