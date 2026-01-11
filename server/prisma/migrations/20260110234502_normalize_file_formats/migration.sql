/*
  Warnings:

  - The `acceptedFormats` column on the `SubmissionRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "SubmissionRequest" DROP COLUMN "acceptedFormats",
ADD COLUMN     "acceptedFormats" TEXT[] DEFAULT ARRAY['pdf', 'docx', 'txt', 'jpg', 'png', 'zip']::TEXT[];
