-- Optional athlete profile used in the AI prompt.
-- Applied additively by scripts/add-profile-columns.mjs.

ALTER TABLE "User" ADD COLUMN "heightCm" INTEGER;
ALTER TABLE "User" ADD COLUMN "sex" TEXT;
ALTER TABLE "User" ADD COLUMN "birthYear" INTEGER;
ALTER TABLE "User" ADD COLUMN "goal" TEXT;
ALTER TABLE "User" ADD COLUMN "experience" TEXT;
ALTER TABLE "User" ADD COLUMN "profileNotes" TEXT;
