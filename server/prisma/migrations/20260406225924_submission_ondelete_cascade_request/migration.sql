-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_requestId_fkey";

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "SubmissionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
