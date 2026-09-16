"use server";

import { requireUser } from "@/app/actions/auth";
import {
  addDaysISO,
  computeStreak,
  estimatedOneRm,
  getTodayLocalDateISO,
} from "@/lib/calculations";
import { prisma } from "@/lib/prisma";
import type {
  AnalyticsPeriod,
  AnalyticsSummary,
  DailyActivityPoint,
  ProgressionPoint,
  TopMuscle,
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
      gymLoad: 0,
      workouts: 0,
      sports: 0,
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

  const [sessions, supplements, sports, previousSessions, previousSupplements, previousSports] =
    await Promise.all([
      prisma.gymSession.findMany({
        where: { userId: user.id, date: { gte: rangeStart } },
        include: { hits: true },
      }),
      prisma.supplementIntake.findMany({
        where: { userId: user.id, date: { gte: rangeStart } },
        select: { date: true },
      }),
      prisma.sportSession.findMany({
        where: { userId: user.id, date: { gte: rangeStart } },
      }),
      prisma.gymSession.findMany({
        where: {
          userId: user.id,
          date: { gte: previousStart, lt: rangeStart },
        },
        include: { hits: true },
      }),
      prisma.supplementIntake.findMany({
        where: {
          userId: user.id,
          date: { gte: previousStart, lt: rangeStart },
        },
        select: { date: true },
      }),
      prisma.sportSession.findMany({
        where: {
          userId: user.id,
          date: { gte: previousStart, lt: rangeStart },
        },
        select: { id: true },
      }),
    ]);

  const dailyMap = new Map(
    buildDailySkeleton(chartDays, today).map((point) => [point.date, point]),
  );

  let totalHits = 0;
  let totalGymLoad = 0;
  const topMap = new Map<string, TopMuscle & { dates: Set<string> }>();

  for (const session of sessions) {
    const point = dailyMap.get(session.date);
    if (point && session.date >= chartStart) {
      point.workouts += 1;
    }

    for (const hit of session.hits) {
      totalHits += 1;
      totalGymLoad += hit.intensity;
      if (point && session.date >= chartStart) {
        point.gymLoad += hit.intensity;
      }
      const key = hit.muscleName;
      const existing = topMap.get(key) ?? {
        name: key,
        load: 0,
        hits: 0,
        days: 0,
        avgIntensity: 0,
        dates: new Set<string>(),
      };
      existing.load += hit.intensity;
      existing.hits += 1;
      existing.dates.add(session.date);
      topMap.set(key, existing);
    }
  }

  for (const intake of supplements) {
    const point = dailyMap.get(intake.date);
    if (point && intake.date >= chartStart) {
      point.supplements += 1;
    }
  }

  let totalSportMinutes = 0;
  let totalSportKm = 0;
  for (const session of sports) {
    const point = dailyMap.get(session.date);
    if (point && session.date >= chartStart) {
      point.sports += 1;
    }
    if (session.durationMinutes != null) {
      totalSportMinutes += session.durationMinutes;
    }
    if (session.distanceKm != null) {
      totalSportKm += session.distanceKm;
    }
    if (session.distanceMeters != null) {
      totalSportKm += session.distanceMeters / 1000;
    }
  }

  let previousLoad = 0;
  for (const session of previousSessions) {
    for (const hit of session.hits) {
      previousLoad += hit.intensity;
    }
  }

  const supplementDays = new Set(supplements.map((item) => item.date));
  const previousSupplementDays = new Set(
    previousSupplements.map((item) => item.date),
  );

  const [allGymDates, allSupplementDates, allSportDates] = await Promise.all([
    prisma.gymSession.findMany({
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
    prisma.sportSession.findMany({
      where: { userId: user.id },
      select: { date: true },
      orderBy: { date: "desc" },
      take: 400,
    }),
  ]);

  const topMuscles = Array.from(topMap.values())
    .map((item) => ({
      name: item.name,
      load: item.load,
      hits: item.hits,
      days: item.dates.size,
      avgIntensity: Math.round((item.load / Math.max(item.hits, 1)) * 10) / 10,
    }))
    .sort((a, b) => b.load - a.load)
    .slice(0, 8);

  return {
    days: rangeDays,
    periodLabel: periodLabel(rangeDays),
    totalWorkouts: sessions.length,
    totalHits,
    totalGymLoad,
    totalSports: sports.length,
    totalSportMinutes,
    totalSportKm: Math.round(totalSportKm * 10) / 10,
    supplementDays: supplementDays.size,
    supplementStreak: computeStreak(allSupplementDates.map((item) => item.date)),
    gymStreak: computeStreak(allGymDates.map((item) => item.date)),
    sportStreak: computeStreak(allSportDates.map((item) => item.date)),
    trends: {
      workouts: percentChange(sessions.length, previousSessions.length),
      gymLoad: percentChange(totalGymLoad, previousLoad),
      sports: percentChange(sports.length, previousSports.length),
      supplements: percentChange(supplementDays.size, previousSupplementDays.size),
    },
    daily: Array.from(dailyMap.values()),
    topMuscles,
  };
}

export async function getNotebookExerciseNames(): Promise<string[]> {
  const user = await requireUser();
  const rows = await prisma.customExercise.findMany({
    where: {
      userId: user.id,
      OR: [
        { workingWeight: { not: null } },
        { prWeight: { not: null } },
        { snapshots: { some: {} } },
      ],
    },
    select: { name: true },
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

  const exercise = await prisma.customExercise.findFirst({
    where: { userId: user.id, name: trimmed },
    include: {
      snapshots: { orderBy: { date: "asc" } },
    },
  });
  if (!exercise) return [];

  const points: ProgressionPoint[] = exercise.snapshots.map((snap) => ({
    date: snap.date,
    workingWeight: snap.workingWeight,
    prWeight: snap.prWeight,
    estimatedOneRm:
      snap.prWeight != null && snap.prReps != null
        ? estimatedOneRm(snap.prWeight, snap.prReps)
        : snap.prWeight,
  }));

  const last = points[points.length - 1];
  const currentWorking = exercise.workingWeight;
  const currentPr = exercise.prWeight;
  const currentOneRm =
    exercise.prWeight != null && exercise.prReps != null
      ? estimatedOneRm(exercise.prWeight, exercise.prReps)
      : exercise.prWeight;
  const differs =
    !last ||
    last.workingWeight !== currentWorking ||
    last.prWeight !== currentPr;

  if (differs && (currentWorking != null || currentPr != null)) {
    points.push({
      date: exercise.prDate ?? getTodayLocalDateISO(),
      workingWeight: currentWorking,
      prWeight: currentPr,
      estimatedOneRm: currentOneRm,
    });
  }

  return points;
}

export async function exportMyData() {
  const user = await requireUser();

  const [sessions, supplements, sports, muscles, customExercises, customSupplements] =
    await Promise.all([
      prisma.gymSession.findMany({
        where: { userId: user.id },
        orderBy: { date: "desc" },
        include: { hits: { orderBy: { intensity: "desc" } } },
      }),
      prisma.supplementIntake.findMany({
        where: { userId: user.id },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      }),
      prisma.sportSession.findMany({
        where: { userId: user.id },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      }),
      prisma.muscle.findMany({
        where: { userId: user.id },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.customExercise.findMany({
        where: { userId: user.id },
        orderBy: { name: "asc" },
        include: { muscle: { select: { name: true } }, snapshots: true },
      }),
      prisma.customSupplement.findMany({
        where: { userId: user.id },
        orderBy: { name: "asc" },
      }),
    ]);

  return {
    exportedAt: new Date().toISOString(),
    username: user.username,
    gymSessions: sessions.map((session) => ({
      id: session.id,
      date: session.date,
      notes: session.notes,
      hits: session.hits.map((hit) => ({
        muscleName: hit.muscleName,
        intensity: hit.intensity,
      })),
    })),
    supplements: supplements.map((item) => ({
      name: item.name,
      dose: item.dose,
      date: item.date,
    })),
    sports: sports.map((item) => ({
      date: item.date,
      type: item.type,
      durationMinutes: item.durationMinutes,
      distanceKm: item.distanceKm,
      distanceMeters: item.distanceMeters,
      pace: item.pace,
      effort: item.effort,
      notes: item.notes,
    })),
    muscles: muscles.map((item) => ({
      name: item.name,
      sortOrder: item.sortOrder,
    })),
    customExercises: customExercises.map((item) => ({
      name: item.name,
      muscleName: item.muscle?.name ?? null,
      workingWeight: item.workingWeight,
      workingReps: item.workingReps,
      prWeight: item.prWeight,
      prReps: item.prReps,
      prDate: item.prDate,
    })),
    customSupplements: customSupplements.map((item) => ({
      name: item.name,
      defaultDose: item.defaultDose,
    })),
  };
}
