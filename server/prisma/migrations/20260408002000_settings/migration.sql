-- CreateEnum
CREATE TYPE "RegistrationMode" AS ENUM ('SCHEDULED', 'OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "SocialLinkType" AS ENUM ('DISCORD', 'FACEBOOK', 'GITHUB', 'INSTAGRAM', 'LINKEDIN', 'X', 'YOUTUBE', 'WEBSITE', 'OTHER');

-- CreateTable
CREATE TABLE "WebsiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'website-settings',
    "contactEmail" TEXT NOT NULL DEFAULT 'event@cslabs.be',
    "bugReportEmail" TEXT NOT NULL DEFAULT 'it@cslabs.be',
    "bugReportWebhookUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSettings" (
    "id" TEXT NOT NULL DEFAULT 'event-settings',
    "title" TEXT NOT NULL DEFAULT 'Le Hackathon du CSLabs',
    "slogan" TEXT NOT NULL DEFAULT '',
    "logoPath" TEXT,
    "teaserEnabled" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "registrationsStartDate" TIMESTAMP(3) NOT NULL,
    "registrationsEndDate" TIMESTAMP(3) NOT NULL,
    "registrationMode" "RegistrationMode" NOT NULL DEFAULT 'SCHEDULED',
    "cautionAmount" INTEGER NOT NULL DEFAULT 20,
    "iban" TEXT,
    "bic" TEXT,
    "locationName" TEXT NOT NULL DEFAULT 'Faculté d''informatique de l''Université de Namur',
    "locationAddress" TEXT NOT NULL DEFAULT 'Rue Grandgagnage 21, 5000 Namur, Belgique',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialLink" (
    "id" TEXT NOT NULL,
    "type" "SocialLinkType" NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'i-lucide-link',
    "url" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" SMALLINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialLink_type_key" ON "SocialLink"("type");

-- CreateIndex
CREATE INDEX "SocialLink_visible_sortOrder_idx" ON "SocialLink"("visible", "sortOrder");
