import "dotenv/config";
import Database from "better-sqlite3";

const url = process.env.DATABASE_URL || "file:./dev.db";
if (!url.startsWith("file:")) {
  console.log("Skipping profile columns; DATABASE_URL is not a SQLite file.");
  process.exit(0);
}

const dbPath = url.slice("file:".length).replace(/\?.*$/, "");
const db = new Database(dbPath);

const table = db
  .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'User'`)
  .get();
if (!table) {
  console.log("User table not found; skip profile columns.");
  db.close();
  process.exit(0);
}

const cols = db
  .prepare(`PRAGMA table_info("User")`)
  .all()
  .map((col) => col.name);

const wanted = [
  ["heightCm", "INTEGER"],
  ["sex", "TEXT"],
  ["birthYear", "INTEGER"],
  ["goal", "TEXT"],
  ["experience", "TEXT"],
  ["profileNotes", "TEXT"],
];

for (const [name, type] of wanted) {
  if (cols.includes(name)) continue;
  db.exec(`ALTER TABLE "User" ADD COLUMN "${name}" ${type}`);
  console.log(`Added User.${name} (nullable). Existing rows unchanged.`);
}

db.close();
