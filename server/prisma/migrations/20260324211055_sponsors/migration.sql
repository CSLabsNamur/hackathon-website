/*
  Warnings:

  - The values [SPONSOR] on the enum `GuestType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GuestType_new" AS ENUM ('SPEAKER', 'JURY', 'COACH', 'PHOTOGRAPHER', 'GUEST', 'OTHER');
ALTER TABLE "Guest" ALTER COLUMN "type" TYPE "GuestType_new" USING ("type"::text::"GuestType_new");
ALTER TYPE "GuestType" RENAME TO "GuestType_old";
ALTER TYPE "GuestType_new" RENAME TO "GuestType";
DROP TYPE "public"."GuestType_old";
COMMIT;

-- CreateTable
CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" JSONB NOT NULL,
    "logo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "hasBadge" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);
