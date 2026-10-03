import "dotenv/config";
import Database from "better-sqlite3";

const url = process.env.DATABASE_URL || "file:./dev.db";
if (!url.startsWith("file:")) {
  console.log("Skipping onboarding columns; DATABASE_URL is not a SQLite file.");
  process.exit(0);
}

const dbPath = url.slice("file:".length).replace(/\?.*$/, "");
const db = new Database(dbPath);

const table = db
  .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'User'`)
  .get();

if (!table) {
  console.log("User table not found; skip onboarding columns.");
  db.close();
  process.exit(0);
}

const cols = db
  .prepare(`PRAGMA table_info("User")`)
  .all()
  .map((col) => col.name);

if (!cols.includes("locale")) {
  db.exec(`ALTER TABLE "User" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en'`);
  console.log("Added User.locale (default en). Existing rows unchanged.");
} else {
  console.log("User.locale already present; existing rows left unchanged.");
}

if (!cols.includes("onboardingCompleted")) {
  db.exec(
    `ALTER TABLE "User" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT 1`,
  );
  console.log(
    "Added User.onboardingCompleted (default true). Existing users skip first-run tour.",
  );
} else {
  console.log("User.onboardingCompleted already present; existing rows left unchanged.");
}

db.close();
