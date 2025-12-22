/*
  Warnings:

  - You are about to drop the column `email` on the `Admin` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `Participant` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Admin` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `Participant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Admin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Participant` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Admin_email_key";

-- DropIndex
DROP INDEX "Participant_email_key";

-- AlterTable
ALTER TABLE "Admin"
    DROP COLUMN "email",
    ADD COLUMN "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Participant"
    DROP COLUMN "email",
    DROP COLUMN "firstName",
    DROP COLUMN "lastName",
    ADD COLUMN "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Room"
    ALTER COLUMN "sequence" DROP DEFAULT;
DROP SEQUENCE "Room_sequence_seq";

-- CreateTable
CREATE TABLE "User"
(
    "id"        TEXT         NOT NULL,
    "email"     TEXT         NOT NULL,
    "firstName" TEXT         NOT NULL,
    "lastName"  TEXT         NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_userId_key" ON "Admin" ("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_userId_key" ON "Participant" ("userId");

-- AddForeignKey
ALTER TABLE "Admin"
    ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant"
    ADD CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
