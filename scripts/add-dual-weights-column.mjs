import "dotenv/config";
import Database from "better-sqlite3";

const url = process.env.DATABASE_URL || "file:./dev.db";
if (!url.startsWith("file:")) {
  console.log("Skipping dualWeights column; DATABASE_URL is not a SQLite file.");
  process.exit(0);
}

const dbPath = url.slice("file:".length);
const db = new Database(dbPath);
const table = db
  .prepare(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'CustomExercise'`,
  )
  .get();

if (!table) {
  console.log("CustomExercise table not found; skip dualWeights column.");
  db.close();
  process.exit(0);
}

const cols = db
  .prepare(`PRAGMA table_info(CustomExercise)`)
  .all()
  .map((col) => col.name);

if (cols.includes("dualWeights")) {
  console.log("dualWeights already present; existing rows left unchanged.");
} else {
  db.exec(
    `ALTER TABLE "CustomExercise" ADD COLUMN "dualWeights" BOOLEAN NOT NULL DEFAULT 0`,
  );
  console.log(
    "Added CustomExercise.dualWeights (default false). Existing rows unchanged.",
  );
}

db.close();
