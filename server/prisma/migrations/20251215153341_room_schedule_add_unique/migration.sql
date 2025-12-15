/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Room` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sequence]` on the table `Room` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title]` on the table `ScheduleItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[requestId,participantId]` on the table `Submission` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ScheduleItem" ALTER COLUMN "icon" SET DEFAULT 'i-lucide-calendar';

-- CreateIndex
CREATE UNIQUE INDEX "Room_name_key" ON "Room"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Room_sequence_key" ON "Room"("sequence");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleItem_title_key" ON "ScheduleItem"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_requestId_participantId_key" ON "Submission"("requestId", "participantId");
