import "dotenv/config";
import fs from "node:fs";
import Database from "better-sqlite3";

const url = process.env.DATABASE_URL || "file:./dev.db";
if (!url.startsWith("file:")) {
  console.log("Skipping SQLite backup; DATABASE_URL is not a SQLite file.");
  process.exit(0);
}

const dbPath = url.slice("file:".length).replace(/\?.*$/, "");
if (!fs.existsSync(dbPath)) {
  console.log(`Skipping SQLite backup; ${dbPath} not found.`);
  process.exit(0);
}

const now = new Date();
const pad = (value) => String(value).padStart(2, "0");
const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
const dest = `${dbPath}.bak-${stamp}`;

const db = new Database(dbPath);
try {
  await db.backup(dest);
  console.log(`Backed up SQLite to ${dest}`);
} finally {
  db.close();
}
