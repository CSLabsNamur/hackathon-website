/*
  Warnings:

  - Made the column `iban` on table `EventSettings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bic` on table `EventSettings` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "EventSettings" ALTER COLUMN "iban" SET NOT NULL,
ALTER COLUMN "bic" SET NOT NULL;
