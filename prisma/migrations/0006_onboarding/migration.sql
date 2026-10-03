-- CreateTable additions for User onboarding.
-- Applied additively by scripts/add-onboarding-columns.mjs.

ALTER TABLE "User" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "User" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT 1;
