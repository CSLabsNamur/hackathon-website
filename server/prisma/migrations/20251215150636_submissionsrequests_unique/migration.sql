/*
  Warnings:

  - A unique constraint covering the columns `[title,deadline]` on the table `SubmissionRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SubmissionRequest_title_deadline_key" ON "SubmissionRequest" ("title", "deadline");
