import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const DEMO_USERNAME = "test";
const DEMO_PASSWORD = "test";

const EXERCISES = [
  { name: "Bench Press", muscleGroup: "CHEST", defaultWeight: 80, defaultReps: 6 },
  { name: "Incline Dumbbell Press", muscleGroup: "CHEST", defaultWeight: 28, defaultReps: 10 },
  { name: "Chest Fly", muscleGroup: "CHEST", defaultWeight: 12, defaultReps: 12 },
  { name: "Push-Up", muscleGroup: "CHEST", defaultWeight: 0, defaultReps: 15 },
  { name: "Lat Pulldown", muscleGroup: "BACK", defaultWeight: 55, defaultReps: 10 },
  { name: "Cable Row", muscleGroup: "BACK", defaultWeight: 50, defaultReps: 10 },
  { name: "Pull-Up", muscleGroup: "BACK", defaultWeight: 0, defaultReps: 8 },
  { name: "Deadlift", muscleGroup: "BACK", defaultWeight: 110, defaultReps: 5 },
  { name: "Squat", muscleGroup: "LEGS", defaultWeight: 90, defaultReps: 6 },
  { name: "Leg Press", muscleGroup: "LEGS", defaultWeight: 160, defaultReps: 10 },
  { name: "Romanian Deadlift", muscleGroup: "LEGS", defaultWeight: 80, defaultReps: 8 },
  { name: "Leg Curl", muscleGroup: "LEGS", defaultWeight: 40, defaultReps: 12 },
  { name: "Calf Raise", muscleGroup: "LEGS", defaultWeight: 60, defaultReps: 15 },
  { name: "Lateral Raises", muscleGroup: "SHOULDERS", defaultWeight: 10, defaultReps: 15 },
  { name: "Overhead Press", muscleGroup: "SHOULDERS", defaultWeight: 42, defaultReps: 8 },
  { name: "Face Pull", muscleGroup: "SHOULDERS", defaultWeight: 18, defaultReps: 15 },
  { name: "Bicep Curl", muscleGroup: "ARMS", defaultWeight: 14, defaultReps: 12 },
  { name: "Tricep Pushdown", muscleGroup: "ARMS", defaultWeight: 22, defaultReps: 12 },
  { name: "Skull Crusher", muscleGroup: "ARMS", defaultWeight: 20, defaultReps: 10 },
  { name: "Hammer Curl", muscleGroup: "ARMS", defaultWeight: 12, defaultReps: 12 },
  { name: "Plank", muscleGroup: "CORE", defaultWeight: 0, defaultReps: 45 },
  { name: "Cable Crunch", muscleGroup: "CORE", defaultWeight: 25, defaultReps: 15 },
  { name: "Hanging Leg Raise", muscleGroup: "CORE", defaultWeight: 0, defaultReps: 10 },
  { name: "Hack Squat", muscleGroup: "LEGS", defaultWeight: 80, defaultReps: 8 },
];

const SUPPLEMENTS = [
  { name: "Whey protein", defaultDose: "1 scoop" },
  { name: "Creatine", defaultDose: "5g" },
  { name: "Pre-workout", defaultDose: "1 scoop" },
  { name: "Electrolytes", defaultDose: "1 tab" },
  { name: "Omega-3", defaultDose: "2 caps" },
];

const PUSH = [
  ["Bench Press", 70, 6],
  ["Incline Dumbbell Press", 26, 10],
  ["Overhead Press", 40, 8],
  ["Lateral Raises", 9, 15],
  ["Tricep Pushdown", 20, 12],
];

const PULL = [
  ["Deadlift", 100, 5],
  ["Lat Pulldown", 50, 10],
  ["Cable Row", 45, 10],
  ["Face Pull", 16, 15],
  ["Bicep Curl", 12, 12],
];

const LEGS = [
  ["Squat", 85, 6],
  ["Romanian Deadlift", 75, 8],
  ["Leg Press", 140, 10],
  ["Leg Curl", 35, 12],
  ["Calf Raise", 50, 15],
];

const UPPER = [
  ["Bench Press", 65, 8],
  ["Pull-Up", 0, 6],
  ["Overhead Press", 38, 8],
  ["Hammer Curl", 12, 12],
  ["Skull Crusher", 18, 10],
  ["Plank", 0, 40],
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

function setsFor(name, baseWeight, baseReps, week, setCount = 3) {
  const isBodyweight = name === "Pull-Up" || name === "Push-Up" || name === "Plank" || name === "Hanging Leg Raise";
  const weight = isBodyweight ? 0 : round(baseWeight + week * (name === "Deadlift" || name === "Squat" ? 1.5 : 1));
  const rows = [];
  for (let i = 0; i < setCount; i += 1) {
    const drop = i === setCount - 1 ? 1 : 0;
    rows.push({
      setNumber: i + 1,
      weight,
      reps: Math.max(4, baseReps - drop + (week % 3 === 0 && i === 0 ? 1 : 0)),
    });
  }
  return rows;
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
        customExercises: {
          create: EXERCISES,
        },
        customSupplements: {
          create: SUPPLEMENTS,
        },
      },
    });

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
        await prisma.workout.create({
          data: {
            userId: user.id,
            date,
            exercises: {
              create: template.map(([name, baseWeight, baseReps], order) => ({
                name,
                order,
                sets: {
                  create: setsFor(name, baseWeight, baseReps, week, name === "Deadlift" ? 3 : 4),
                },
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
    const todayWorkout = await prisma.workout.findFirst({
      where: { userId: user.id, date: today },
      select: { id: true },
    });
    if (!todayWorkout) {
      await prisma.workout.create({
        data: {
          userId: user.id,
          date: today,
          exercises: {
            create: PUSH.slice(0, 3).map(([name, baseWeight, baseReps], order) => ({
              name,
              order,
              sets: { create: setsFor(name, baseWeight, baseReps, 12, 3) },
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
    const [workoutCount, sportCount, suppCount] = await Promise.all([
      prisma.workout.count({ where: { userId: user.id } }),
      prisma.sportSession.count({ where: { userId: user.id } }),
      prisma.supplementIntake.count({ where: { userId: user.id } }),
    ]);

    console.log("Demo user ready.");
    console.log(`  username: ${DEMO_USERNAME}`);
    console.log(`  password: ${DEMO_PASSWORD}`);
    console.log(`  gym days: ${workoutCount}`);
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
