-- Sport catalog, with the inputs each sport asks for.

ALTER TABLE "User" ADD COLUMN "sportsSeeded" BOOLEAN NOT NULL DEFAULT 0;

CREATE TABLE "Sport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "fields" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Sport_userId_idx" ON "Sport"("userId");

CREATE UNIQUE INDEX "Sport_userId_nameKey_key" ON "Sport"("userId", "nameKey");
