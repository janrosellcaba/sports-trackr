-- CreateTable
CREATE TABLE "BodyWeight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "weightKg" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BodyWeight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BodyWeight_date_check" CHECK ("date" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
    CONSTRAINT "BodyWeight_weightKg_check" CHECK ("weightKg" >= 20 AND "weightKg" <= 400)
);

-- CreateIndex
CREATE INDEX "BodyWeight_userId_idx" ON "BodyWeight"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BodyWeight_userId_date_key" ON "BodyWeight"("userId", "date");
