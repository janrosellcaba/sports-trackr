-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "accentTheme" TEXT NOT NULL DEFAULT 'volt',
    "colorMode" TEXT NOT NULL DEFAULT 'dark',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "catalogSeeded" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "User_role_check" CHECK ("role" = 'USER'),
    CONSTRAINT "User_colorMode_check" CHECK ("colorMode" IN ('dark', 'light'))
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Muscle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Muscle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GymSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GymSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GymSession_date_check" CHECK ("date" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
);

-- CreateTable
CREATE TABLE "MuscleHit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "muscleId" TEXT NOT NULL,
    "muscleName" TEXT NOT NULL,
    "intensity" INTEGER NOT NULL,
    CONSTRAINT "MuscleHit_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GymSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MuscleHit_muscleId_fkey" FOREIGN KEY ("muscleId") REFERENCES "Muscle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MuscleHit_intensity_check" CHECK ("intensity" >= 1 AND "intensity" <= 5)
);

-- CreateTable
CREATE TABLE "SupplementIntake" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplementIntake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SupplementIntake_date_check" CHECK ("date" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
);

-- CreateTable
CREATE TABLE "SportSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "durationMinutes" INTEGER,
    "distanceKm" REAL,
    "distanceMeters" REAL,
    "pace" TEXT,
    "effort" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SportSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SportSession_date_check" CHECK ("date" GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
);

-- CreateTable
CREATE TABLE "CustomExercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "muscleId" TEXT,
    "workingWeight" REAL,
    "workingReps" INTEGER,
    "prWeight" REAL,
    "prReps" INTEGER,
    "prDate" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomExercise_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomExercise_muscleId_fkey" FOREIGN KEY ("muscleId") REFERENCES "Muscle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExerciseSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exerciseId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "workingWeight" REAL,
    "workingReps" INTEGER,
    "prWeight" REAL,
    "prReps" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExerciseSnapshot_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "CustomExercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomSupplement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "defaultDose" TEXT NOT NULL,
    "iconOrType" TEXT NOT NULL DEFAULT 'pill',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomSupplement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Muscle_userId_idx" ON "Muscle"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Muscle_userId_nameKey_key" ON "Muscle"("userId", "nameKey");

-- CreateIndex
CREATE INDEX "GymSession_userId_idx" ON "GymSession"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GymSession_userId_date_key" ON "GymSession"("userId", "date");

-- CreateIndex
CREATE INDEX "MuscleHit_sessionId_idx" ON "MuscleHit"("sessionId");

-- CreateIndex
CREATE INDEX "MuscleHit_muscleId_idx" ON "MuscleHit"("muscleId");

-- CreateIndex
CREATE UNIQUE INDEX "MuscleHit_sessionId_muscleId_key" ON "MuscleHit"("sessionId", "muscleId");

-- CreateIndex
CREATE INDEX "SupplementIntake_userId_date_idx" ON "SupplementIntake"("userId", "date");

-- CreateIndex
CREATE INDEX "SportSession_userId_date_idx" ON "SportSession"("userId", "date");

-- CreateIndex
CREATE INDEX "CustomExercise_userId_idx" ON "CustomExercise"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomExercise_userId_nameKey_key" ON "CustomExercise"("userId", "nameKey");

-- CreateIndex
CREATE INDEX "ExerciseSnapshot_exerciseId_idx" ON "ExerciseSnapshot"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseSnapshot_exerciseId_date_key" ON "ExerciseSnapshot"("exerciseId", "date");

-- CreateIndex
CREATE INDEX "CustomSupplement_userId_idx" ON "CustomSupplement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomSupplement_userId_nameKey_key" ON "CustomSupplement"("userId", "nameKey");
