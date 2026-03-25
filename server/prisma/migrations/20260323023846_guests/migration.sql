-- CreateEnum
CREATE TYPE "GuestType" AS ENUM ('SPEAKER', 'SPONSOR', 'JURY', 'COACH', 'PHOTOGRAPHER', 'GUEST', 'OTHER');

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "GuestType" NOT NULL,
    "company" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);
