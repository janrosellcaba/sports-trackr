import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const DEMO_USERNAME = "test";
const DEMO_PASSWORD = "test";

const MUSCLES = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Forearms",
  "Abs",
  "Quads",
  "Hamstrings",
  "Abductors",
  "Glutes",
  "Calves",
  "Other",
];

const EXERCISES = [
  { name: "Bench Press", muscle: "Chest", workingWeight: 80, workingReps: 6, prWeight: 90, prReps: 3 },
  { name: "Incline Dumbbell Press", muscle: "Chest", workingWeight: 28, workingReps: 10, prWeight: 32, prReps: 8 },
  { name: "Chest Fly", muscle: "Chest", workingWeight: 12, workingReps: 12, prWeight: 14, prReps: 10 },
  { name: "Push-Up", muscle: "Chest", workingWeight: 0, workingReps: 15, prWeight: 0, prReps: 25 },
  { name: "Lat Pulldown", muscle: "Back", workingWeight: 55, workingReps: 10, prWeight: 65, prReps: 8 },
  { name: "Cable Row", muscle: "Back", workingWeight: 50, workingReps: 10, prWeight: 60, prReps: 8 },
  { name: "Pull-Up", muscle: "Back", workingWeight: 0, workingReps: 8, prWeight: 0, prReps: 12 },
  { name: "Deadlift", muscle: "Back", workingWeight: 110, workingReps: 5, prWeight: 130, prReps: 3 },
  { name: "Squat", muscle: "Quads", workingWeight: 90, workingReps: 6, prWeight: 110, prReps: 3 },
  { name: "Leg Press", muscle: "Quads", workingWeight: 160, workingReps: 10, prWeight: 200, prReps: 8 },
  { name: "Romanian Deadlift", muscle: "Hamstrings", workingWeight: 80, workingReps: 8, prWeight: 95, prReps: 6 },
  { name: "Leg Curl", muscle: "Hamstrings", workingWeight: 40, workingReps: 12, prWeight: 50, prReps: 10 },
  { name: "Calf Raise", muscle: "Calves", workingWeight: 60, workingReps: 15, prWeight: 80, prReps: 12 },
  { name: "Lateral Raises", muscle: "Shoulders", workingWeight: 10, workingReps: 15, prWeight: 12, prReps: 12 },
  { name: "Overhead Press", muscle: "Shoulders", workingWeight: 42, workingReps: 8, prWeight: 50, prReps: 5 },
  { name: "Face Pull", muscle: "Shoulders", workingWeight: 18, workingReps: 15, prWeight: 22, prReps: 12 },
  { name: "Bicep Curl", muscle: "Biceps", workingWeight: 14, workingReps: 12, prWeight: 18, prReps: 8 },
  { name: "Tricep Pushdown", muscle: "Triceps", workingWeight: 22, workingReps: 12, prWeight: 28, prReps: 10 },
  { name: "Skull Crusher", muscle: "Triceps", workingWeight: 20, workingReps: 10, prWeight: 25, prReps: 8 },
  { name: "Hammer Curl", muscle: "Biceps", workingWeight: 12, workingReps: 12, prWeight: 16, prReps: 10 },
  { name: "Plank", muscle: "Abs", workingWeight: 0, workingReps: 45, prWeight: 0, prReps: 90 },
  { name: "Cable Crunch", muscle: "Abs", workingWeight: 25, workingReps: 15, prWeight: 35, prReps: 12 },
  { name: "Hanging Leg Raise", muscle: "Abs", workingWeight: 0, workingReps: 10, prWeight: 0, prReps: 15 },
];

const SUPPLEMENTS = [
  { name: "Whey protein", defaultDose: "1 scoop" },
  { name: "Creatine", defaultDose: "5g" },
  { name: "Pre-workout", defaultDose: "1 scoop" },
  { name: "Electrolytes", defaultDose: "1 tab" },
  { name: "Omega-3", defaultDose: "2 caps" },
];

const PUSH = [
  ["Chest", 4],
  ["Shoulders", 3],
  ["Triceps", 3],
];

const PULL = [
  ["Back", 5],
  ["Biceps", 3],
  ["Forearms", 2],
];

const LEGS = [
  ["Quads", 5],
  ["Hamstrings", 4],
  ["Glutes", 3],
  ["Calves", 2],
  ["Abductors", 2],
];

const UPPER = [
  ["Chest", 3],
  ["Back", 3],
  ["Shoulders", 3],
  ["Biceps", 2],
  ["Triceps", 2],
  ["Abs", 2],
];

function pad(value) {
  return String(value).padStart(2, "0");
}

function toISO(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function daysAgo(n, from = new Date()) {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  date.setDate(date.getDate() - n);
  return date;
}

function round(value, step = 0.5) {
  return Math.round(value / step) * step;
}

function clampIntensity(value) {
  return Math.max(1, Math.min(5, Math.round(value)));
}

function createPrisma() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

async function main() {
  const prisma = createPrisma();

  try {
    const others = await prisma.user.findMany({
      where: { username: { not: DEMO_USERNAME } },
      select: { username: true },
    });
    console.log("Leaving these accounts alone:", others.map((user) => user.username).join(", ") || "(none)");

    const existing = await prisma.user.findUnique({
      where: { username: DEMO_USERNAME },
      select: { id: true },
    });
    if (existing) {
      console.log("Refreshing demo user `test` only (cascade delete of that user's logs).");
      await prisma.user.delete({ where: { id: existing.id } });
    }

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const user = await prisma.user.create({
      data: {
        username: DEMO_USERNAME,
        passwordHash,
        role: "USER",
        catalogSeeded: true,
        muscles: {
          create: MUSCLES.map((name, sortOrder) => ({ name, sortOrder })),
        },
        customSupplements: {
          create: SUPPLEMENTS,
        },
      },
    });

    const muscles = await prisma.muscle.findMany({
      where: { userId: user.id },
    });
    const muscleIdByName = new Map(muscles.map((item) => [item.name, item.id]));

    await prisma.customExercise.createMany({
      data: EXERCISES.map((item) => ({
        userId: user.id,
        name: item.name,
        muscleId: muscleIdByName.get(item.muscle) ?? null,
        workingWeight: item.workingWeight,
        workingReps: item.workingReps,
        prWeight: item.prWeight,
        prReps: item.prReps,
        prDate: toISO(daysAgo(3)),
      })),
    });

    const notebook = await prisma.customExercise.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, workingWeight: true, workingReps: true, prWeight: true, prReps: true },
    });
    const snapshots = [];
    for (const exercise of notebook) {
      if (exercise.workingWeight == null) continue;
      snapshots.push({
        exerciseId: exercise.id,
        date: toISO(daysAgo(60)),
        workingWeight: round(exercise.workingWeight * 0.9),
        workingReps: exercise.workingReps,
        prWeight: exercise.prWeight == null ? null : round(exercise.prWeight * 0.88),
        prReps: exercise.prReps,
      });
      snapshots.push({
        exerciseId: exercise.id,
        date: toISO(daysAgo(30)),
        workingWeight: round(exercise.workingWeight * 0.96),
        workingReps: exercise.workingReps,
        prWeight: exercise.prWeight == null ? null : round(exercise.prWeight * 0.95),
        prReps: exercise.prReps,
      });
      snapshots.push({
        exerciseId: exercise.id,
        date: toISO(daysAgo(3)),
        workingWeight: exercise.workingWeight,
        workingReps: exercise.workingReps,
        prWeight: exercise.prWeight,
        prReps: exercise.prReps,
      });
    }
    await prisma.exerciseSnapshot.createMany({ data: snapshots });

    const supplements = [];
    const sports = [];

    for (let ago = 89; ago >= 0; ago -= 1) {
      const dateObj = daysAgo(ago);
      const date = toISO(dateObj);
      const weekday = dateObj.getDay();
      const week = Math.floor((89 - ago) / 7);
      const skipGym = ago % 17 === 3;

      let template = null;
      if (!skipGym) {
        if (weekday === 1) template = PUSH;
        else if (weekday === 3) template = PULL;
        else if (weekday === 5) template = LEGS;
        else if (weekday === 2 && week % 4 === 0) template = UPPER;
      }

      if (template) {
        await prisma.gymSession.create({
          data: {
            userId: user.id,
            date,
            hits: {
              create: template.map(([name, base]) => ({
                muscleId: muscleIdByName.get(name) ?? null,
                muscleName: name,
                intensity: clampIntensity(base + (week % 3 === 0 ? 1 : 0) - (week % 5 === 0 ? 1 : 0)),
              })),
            },
          },
        });
      }

      if (ago % 2 === 0 || weekday !== 0) {
        supplements.push({ userId: user.id, name: "Creatine", dose: "5g", date });
      }
      if (weekday === 1 || weekday === 3 || weekday === 5 || weekday === 2) {
        supplements.push({ userId: user.id, name: "Omega-3", dose: "2 caps", date });
      }
      if (template) {
        supplements.push({ userId: user.id, name: "Whey protein", dose: "1 scoop", date });
        if (weekday !== 2) {
          supplements.push({ userId: user.id, name: "Pre-workout", dose: "1 scoop", date });
        }
      } else if (weekday === 6 || weekday === 0) {
        supplements.push({ userId: user.id, name: "Whey protein", dose: "1 scoop", date });
      }
      if (weekday === 6 || (weekday === 0 && week % 2 === 0)) {
        supplements.push({ userId: user.id, name: "Electrolytes", dose: "1 tab", date });
      }

      if (weekday === 2 && week % 2 === 0) {
        sports.push({
          userId: user.id,
          date,
          type: "RUNNING",
          distanceKm: round(6.5 + (week % 5) * 0.8, 0.1),
          pace: week % 2 === 0 ? "5:20" : "5:40",
          notes: week % 4 === 0 ? "Easy aerobic, felt smooth." : null,
        });
      }
      if (weekday === 4 && week % 2 === 1) {
        sports.push({
          userId: user.id,
          date,
          type: "PADEL",
          durationMinutes: 90,
          effort: week % 4 === 1 ? "HARD" : "MODERATE",
          notes:
            week % 4 === 1
              ? "Match night. Lost the first, won the second."
              : "Social games, lots of lobs.",
        });
      }
      if (weekday === 6) {
        const weekend = week % 5;
        if (weekend === 0) {
          sports.push({
            userId: user.id,
            date,
            type: "CYCLING",
            distanceKm: round(22 + week, 0.1),
            durationMinutes: 70 + week,
            notes: "Loop out of town.",
          });
        } else if (weekend === 1) {
          sports.push({
            userId: user.id,
            date,
            type: "HIKING",
            distanceKm: round(11 + (week % 3), 0.1),
            durationMinutes: 150,
            notes: "Hills. Knees ok.",
          });
        } else if (weekend === 2) {
          sports.push({
            userId: user.id,
            date,
            type: "SWIMMING",
            distanceMeters: 1200 + (week % 4) * 100,
            durationMinutes: 35,
          });
        } else if (weekend === 3) {
          sports.push({
            userId: user.id,
            date,
            type: "FOOTBALL",
            durationMinutes: 80,
            effort: "HARD",
            notes: "5-a-side. Sprints in the second half.",
          });
        } else {
          sports.push({
            userId: user.id,
            date,
            type: "TENNIS",
            durationMinutes: 70,
            effort: "MODERATE",
            notes: "Doubles.",
          });
        }
      }
      if (weekday === 0 && week % 3 === 1) {
        sports.push({
          userId: user.id,
          date,
          type: "WALKING",
          distanceKm: 6.2,
          durationMinutes: 75,
        });
      }
    }

    await prisma.supplementIntake.createMany({ data: supplements });
    await prisma.sportSession.createMany({ data: sports });

    const today = toISO(new Date());
    const todayGym = await prisma.gymSession.findFirst({
      where: { userId: user.id, date: today },
      select: { id: true },
    });
    if (!todayGym) {
      await prisma.gymSession.create({
        data: {
          userId: user.id,
          date: today,
          hits: {
            create: PUSH.map(([name, intensity]) => ({
              muscleId: muscleIdByName.get(name) ?? null,
              muscleName: name,
              intensity,
            })),
          },
        },
      });
    }
    const todaySport = await prisma.sportSession.findFirst({
      where: { userId: user.id, date: today },
      select: { id: true },
    });
    if (!todaySport) {
      await prisma.sportSession.create({
        data: {
          userId: user.id,
          date: today,
          type: "PADEL",
          durationMinutes: 90,
          effort: "EASY",
          notes: "Morning hit. Kept it light.",
        },
      });
    }

    const leftover = await prisma.user.findMany({
      where: { username: { not: DEMO_USERNAME } },
      select: { username: true },
    });
    const [gymCount, sportCount, suppCount] = await Promise.all([
      prisma.gymSession.count({ where: { userId: user.id } }),
      prisma.sportSession.count({ where: { userId: user.id } }),
      prisma.supplementIntake.count({ where: { userId: user.id } }),
    ]);

    console.log("Demo user ready.");
    console.log(`  username: ${DEMO_USERNAME}`);
    console.log(`  password: ${DEMO_PASSWORD}`);
    console.log(`  gym days: ${gymCount}`);
    console.log(`  sports:   ${sportCount}`);
    console.log(`  supps:    ${suppCount}`);
    console.log("Other accounts still here:", leftover.map((row) => row.username).join(", ") || "(none)");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
