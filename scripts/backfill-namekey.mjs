import Database from "better-sqlite3";

const db = new Database("dev.db");

function columns(table) {
  return db.prepare(`PRAGMA table_info(${table})`).all().map((col) => col.name);
}

function addNameKey(table) {
  const cols = columns(table);
  if (!cols.includes("nameKey")) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN nameKey TEXT`);
  }
  db.exec(
    `UPDATE ${table} SET nameKey = lower(trim(name)) WHERE nameKey IS NULL OR nameKey = ''`,
  );
}

const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
  .all();
console.log(tables.map((row) => row.name).join(", "));

for (const table of ["Muscle", "CustomExercise", "CustomSupplement"]) {
  if (tables.some((row) => row.name === table)) addNameKey(table);
}

const muscleHits = tables.some((row) => row.name === "MuscleHit")
  ? db.prepare("SELECT COUNT(*) AS n FROM MuscleHit WHERE muscleId IS NULL").get()
  : { n: 0 };
console.log("null muscle hits", muscleHits.n);

db.close();
console.log("nameKey backfill done");
