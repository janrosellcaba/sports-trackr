import "dotenv/config";
import Database from "better-sqlite3";

const url = process.env.DATABASE_URL || "file:./dev.db";
if (!url.startsWith("file:")) {
  console.log("Skipping BodyWeight table; DATABASE_URL is not a SQLite file.");
  process.exit(0);
}

const dbPath = url.slice("file:".length).replace(/\?.*$/, "");
const db = new Database(dbPath);

const exists = db
  .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'BodyWeight'`)
  .get();

if (exists) {
  const columns = db.prepare(`PRAGMA table_info("BodyWeight")`).all();
  const names = new Set(columns.map((column) => column.name));
  if (names.has("weightKg")) {
    console.log("BodyWeight already present; existing rows left unchanged.");
  } else if (names.has("kg") && !names.has("weightKg")) {
    db.exec(`ALTER TABLE "BodyWeight" RENAME COLUMN "kg" TO "weightKg"`);
    console.log("Renamed BodyWeight.kg to weightKg. Existing rows kept.");
  } else {
    console.log("BodyWeight already present; existing rows left unchanged.");
  }
  db.close();
  process.exit(0);
}

db.exec(`
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
  CREATE INDEX "BodyWeight_userId_idx" ON "BodyWeight"("userId");
  CREATE UNIQUE INDEX "BodyWeight_userId_date_key" ON "BodyWeight"("userId", "date");
`);

console.log("Created BodyWeight table. No existing rows were touched.");
db.close();
