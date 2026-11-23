/*
  Warnings:

  - A unique constraint covering the columns `[captainId]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `captainId` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "captainId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Team_captainId_key" ON "Team"("captainId");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_captainId_fkey" FOREIGN KEY ("captainId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
