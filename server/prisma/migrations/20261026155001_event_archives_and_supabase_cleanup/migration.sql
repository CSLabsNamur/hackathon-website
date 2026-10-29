/*
  Warnings:

  - A unique constraint covering the columns `[editionId]` on the table `EventSettings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SupabaseCleanupJobType" AS ENUM ('STORAGE_OBJECT', 'AUTH_USER');

-- CreateEnum
CREATE TYPE "SupabaseCleanupJobScope" AS ENUM ('GENERAL', 'ROLLOVER');

-- AlterTable
ALTER TABLE "EventSettings" ADD COLUMN "editionId" TEXT;
-- Backfill the singleton event settings row before making its identity mandatory.
UPDATE "EventSettings" SET "editionId" = 'ivkvzs9dr4nbgss5tnkqlidb';
ALTER TABLE "EventSettings" ALTER COLUMN "editionId" SET NOT NULL;

-- CreateTable
CREATE TABLE "EventArchive" (
    "id" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "snapshot" JSONB NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventArchive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupabaseCleanupJob" (
    "id" TEXT NOT NULL,
    "type" "SupabaseCleanupJobType" NOT NULL,
    "scope" "SupabaseCleanupJobScope" NOT NULL DEFAULT 'GENERAL',
    "bucket" TEXT,
    "target" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupabaseCleanupJob_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SupabaseCleanupJob_type_bucket_check" CHECK (
        ("type" = 'STORAGE_OBJECT' AND "bucket" IS NOT NULL)
        OR ("type" = 'AUTH_USER' AND "bucket" IS NULL)
    )
);

-- CreateIndex
CREATE UNIQUE INDEX "EventArchive_editionId_key" ON "EventArchive"("editionId");

-- CreateIndex
CREATE INDEX "Admin_userId_idx" ON "Admin"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventSettings_editionId_key" ON "EventSettings"("editionId");

-- CreateIndex
CREATE INDEX "Participant_userId_idx" ON "Participant"("userId");

-- CreateIndex
CREATE INDEX "User_supabaseAuthId_idx" ON "User"("supabaseAuthId");
