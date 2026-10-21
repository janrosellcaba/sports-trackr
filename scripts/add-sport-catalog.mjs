import "dotenv/config";
import Database from "better-sqlite3";

const url = process.env.DATABASE_URL || "file:./dev.db";
if (!url.startsWith("file:")) {
  console.log("Skipping sport catalog; DATABASE_URL is not a SQLite file.");
  process.exit(0);
}

const dbPath = url.slice("file:".length).replace(/\?.*$/, "");
const db = new Database(dbPath);

const userColumns = db.prepare(`PRAGMA table_info("User")`).all();
const userNames = new Set(userColumns.map((column) => column.name));
if (!userNames.has("sportsSeeded")) {
  db.exec(`ALTER TABLE "User" ADD COLUMN "sportsSeeded" BOOLEAN NOT NULL DEFAULT 0`);
  console.log("Added User.sportsSeeded.");
}

const table = db
  .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'Sport'`)
  .get();
if (!table) {
  db.exec(`
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
  `);
  console.log("Created Sport table.");
} else {
  console.log("Sport catalog already present.");
}

db.close();
