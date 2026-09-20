import "dotenv/config";
import Database from "better-sqlite3";

const url = process.env.DATABASE_URL || "file:./dev.db";
if (!url.startsWith("file:")) {
  console.log("Skipping CustomSupplement drop; DATABASE_URL is not a SQLite file.");
  process.exit(0);
}

const dbPath = url.slice("file:".length).replace(/\?.*$/, "");
const db = new Database(dbPath);
const table = db
  .prepare(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'CustomSupplement'`,
  )
  .get();

if (!table) {
  console.log("CustomSupplement table already absent; intake logs left unchanged.");
  db.close();
  process.exit(0);
}

const count = db.prepare(`SELECT COUNT(*) AS n FROM "CustomSupplement"`).get();
db.exec(`DROP INDEX IF EXISTS "CustomSupplement_userId_nameKey_key"`);
db.exec(`DROP INDEX IF EXISTS "CustomSupplement_userId_idx"`);
db.exec(`DROP TABLE IF EXISTS "CustomSupplement"`);
console.log(
  `Dropped CustomSupplement catalog (${count.n} rows). SupplementIntake logs were not touched.`,
);
db.close();
