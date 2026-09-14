"use server";

import { requireUser } from "@/app/actions/auth";
import {
  addDaysISO,
  computeStreak,
  estimatedOneRm,
  getTodayLocalDateISO,
  setVolume,
} from "@/lib/calculations";
import { prisma } from "@/lib/prisma";
import type {
  AnalyticsPeriod,
  AnalyticsSummary,
  DailyActivityPoint,
  ProgressionPoint,
  TopExercise,
} from "@/types/trackr";

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function periodLabel(days: number): string {
  if (days <= 7) return "Last 7 days";
  if (days <= 30) return "Last 30 days";
  if (days <= 90) return "Last 90 days";
  return "All time";
}

function buildDailySkeleton(days: number, endISO: string): DailyActivityPoint[] {
  const points: DailyActivityPoint[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    points.push({
      date: addDaysISO(endISO, -i),
      volumeKg: 0,
      workouts: 0,
      supplements: 0,
    });
  }
  return points;
}

export async function getAnalyticsSummary(
  period: AnalyticsPeriod = 30,
): Promise<AnalyticsSummary> {
  const user = await requireUser();
  const today = getTodayLocalDateISO();
  const rangeDays = period === 0 ? 3650 : period;
  const chartDays = period === 0 ? 90 : rangeDays;
  const rangeStart = addDaysISO(today, -(rangeDays - 1));
  const previousStart = addDaysISO(rangeStart, -rangeDays);
  const chartStart = addDaysISO(today, -(chartDays - 1));

  const [workouts, supplements, previousWorkouts, previousSupplements] =
    await Promise.all([
      prisma.workout.findMany({
        where: { userId: user.id, date: { gte: rangeStart } },
        include: { exercises: { include: { sets: true } } },
      }),
      prisma.supplementIntake.findMany({
        where: { userId: user.id, date: { gte: rangeStart } },
        select: { date: true },
      }),
      prisma.workout.findMany({
        where: {
          userId: user.id,
          date: { gte: previousStart, lt: rangeStart },
        },
        include: { exercises: { include: { sets: true } } },
      }),
      prisma.supplementIntake.findMany({
        where: {
          userId: user.id,
          date: { gte: previousStart, lt: rangeStart },
        },
        select: { date: true },
      }),
    ]);

  const dailyMap = new Map(
    buildDailySkeleton(chartDays, today).map((point) => [point.date, point]),
  );

  let totalVolumeKg = 0;
  let totalSets = 0;
  const topMap = new Map<string, TopExercise>();

  for (const workout of workouts) {
    const point = dailyMap.get(workout.date);
    if (point && workout.date >= chartStart) {
      point.workouts += 1;
    }

    for (const exercise of workout.exercises) {
      let exerciseVolume = 0;
      for (const set of exercise.sets) {
        const volume = setVolume(set.weight, set.reps);
        totalVolumeKg += volume;
        totalSets += 1;
        exerciseVolume += volume;
        if (point && workout.date >= chartStart) {
          point.volumeKg += volume;
        }
      }
      const existing = topMap.get(exercise.name) ?? {
        name: exercise.name,
        volumeKg: 0,
        sets: 0,
        workouts: 0,
      };
      existing.volumeKg += exerciseVolume;
      existing.sets += exercise.sets.length;
      existing.workouts += 1;
      topMap.set(exercise.name, existing);
    }
  }

  for (const intake of supplements) {
    const point = dailyMap.get(intake.date);
    if (point && intake.date >= chartStart) {
      point.supplements += 1;
    }
  }

  let previousVolume = 0;
  let previousSets = 0;
  for (const workout of previousWorkouts) {
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        previousVolume += setVolume(set.weight, set.reps);
        previousSets += 1;
      }
    }
  }

  const supplementDays = new Set(supplements.map((item) => item.date));
  const previousSupplementDays = new Set(
    previousSupplements.map((item) => item.date),
  );

  const [allGymDates, allSupplementDates] = await Promise.all([
    prisma.workout.findMany({
      where: { userId: user.id },
      select: { date: true },
      orderBy: { date: "desc" },
      take: 400,
    }),
    prisma.supplementIntake.findMany({
      where: { userId: user.id },
      select: { date: true },
      orderBy: { date: "desc" },
      take: 400,
    }),
  ]);

  const topExercises = Array.from(topMap.values())
    .map((item) => ({ ...item, volumeKg: Math.round(item.volumeKg) }))
    .sort((a, b) => b.volumeKg - a.volumeKg)
    .slice(0, 6);

  return {
    days: rangeDays,
    periodLabel: periodLabel(rangeDays),
    totalWorkouts: workouts.length,
    totalSets,
    totalVolumeKg: Math.round(totalVolumeKg),
    supplementDays: supplementDays.size,
    supplementStreak: computeStreak(allSupplementDates.map((item) => item.date)),
    gymStreak: computeStreak(allGymDates.map((item) => item.date)),
    trends: {
      workouts: percentChange(workouts.length, previousWorkouts.length),
      sets: percentChange(totalSets, previousSets),
      volumeKg: percentChange(totalVolumeKg, previousVolume),
      supplements: percentChange(supplementDays.size, previousSupplementDays.size),
    },
    daily: Array.from(dailyMap.values()).map((point) => ({
      ...point,
      volumeKg: Math.round(point.volumeKg),
    })),
    topExercises,
  };
}

export async function getExerciseNames(): Promise<string[]> {
  const user = await requireUser();
  const rows = await prisma.exerciseLog.findMany({
    where: { workout: { userId: user.id } },
    select: { name: true },
    distinct: ["name"],
    orderBy: { name: "asc" },
  });
  return rows.map((row) => row.name);
}

export async function getExerciseProgression(
  exerciseName: string,
): Promise<ProgressionPoint[]> {
  const user = await requireUser();
  const trimmed = exerciseName.trim();
  if (!trimmed) return [];

  const logs = await prisma.exerciseLog.findMany({
    where: { name: trimmed, workout: { userId: user.id } },
    include: {
      workout: { select: { date: true } },
      sets: true,
    },
    orderBy: { workout: { date: "asc" } },
  });

  const byDate = new Map<string, ProgressionPoint>();

  for (const log of logs) {
    if (log.sets.length === 0) continue;

    let bestWeight = 0;
    let bestOneRm = 0;
    let bestReps = 0;

    for (const set of log.sets) {
      const oneRm = estimatedOneRm(set.weight, set.reps);
      if (set.weight > bestWeight) {
        bestWeight = set.weight;
        bestReps = set.reps;
      }
      if (oneRm > bestOneRm) {
        bestOneRm = oneRm;
      }
    }

    const key = log.workout.date;
    const existing = byDate.get(key);
    if (!existing || bestOneRm > existing.estimatedOneRm) {
      byDate.set(key, {
        date: key,
        maxWeight: bestWeight,
        estimatedOneRm: bestOneRm,
        bestSetReps: bestReps,
      });
    }
  }

  return Array.from(byDate.values());
}

export async function exportMyData() {
  const user = await requireUser();

  const [workouts, supplements, customExercises, customSupplements] =
    await Promise.all([
      prisma.workout.findMany({
        where: { userId: user.id },
        orderBy: { date: "desc" },
        include: {
          exercises: {
            orderBy: { order: "asc" },
            include: { sets: { orderBy: { setNumber: "asc" } } },
          },
        },
      }),
      prisma.supplementIntake.findMany({
        where: { userId: user.id },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      }),
      prisma.customExercise.findMany({
        where: { userId: user.id },
        orderBy: { name: "asc" },
      }),
      prisma.customSupplement.findMany({
        where: { userId: user.id },
        orderBy: { name: "asc" },
      }),
    ]);

  return {
    exportedAt: new Date().toISOString(),
    username: user.username,
    workouts: workouts.map((workout) => ({
      id: workout.id,
      date: workout.date,
      notes: workout.notes,
      exercises: workout.exercises.map((exercise) => ({
        name: exercise.name,
        sets: exercise.sets.map((set) => ({
          setNumber: set.setNumber,
          weight: set.weight,
          reps: set.reps,
        })),
      })),
    })),
    supplements: supplements.map((item) => ({
      name: item.name,
      dose: item.dose,
      date: item.date,
    })),
    customExercises: customExercises.map((item) => ({
      name: item.name,
      muscleGroup: item.muscleGroup,
      defaultWeight: item.defaultWeight,
      defaultReps: item.defaultReps,
    })),
    customSupplements: customSupplements.map((item) => ({
      name: item.name,
      defaultDose: item.defaultDose,
    })),
  };
}
