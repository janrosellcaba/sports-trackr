"use server";

import { requireUser } from "@/app/actions/auth";
import {
  addDaysISO,
  computeStreak,
  estimatedOneRm,
} from "@/lib/calculations";
import {
  ANALYTICS_ALL_CHART_DAYS,
  parseAnalyticsPeriod,
  percentChange,
  periodLabel,
} from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { getRequestToday } from "@/lib/request-today";
import type {
  AnalyticsPeriod,
  AnalyticsSummary,
  DailyActivityPoint,
  NotebookExercise,
  ProgressionPoint,
  TopMuscle,
} from "@/types/trackr";

function uniqueDates(dates: string[]): string[] {
  return [...new Set(dates)];
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
  periodInput: AnalyticsPeriod | number = 30,
  todayOverride?: string,
): Promise<AnalyticsSummary> {
  const user = await requireUser();
  const period = parseAnalyticsPeriod(periodInput);
  const today = todayOverride ?? (await getRequestToday());
  const allTime = period === 0;
  const rangeDays = allTime ? ANALYTICS_ALL_CHART_DAYS : period;
  const rangeStart = addDaysISO(today, -(rangeDays - 1));
  const previousStart = addDaysISO(rangeStart, -rangeDays);

  const [
    chartSessions,
    chartSupplements,
    chartSports,
    previousSessions,
    previousSupplements,
    previousSports,
    workoutCount,
    hitAgg,
    sportAgg,
    sportCount,
    allGymDates,
    allSupplementDates,
    allSportDates,
    topHits,
  ] = await Promise.all([
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
    allTime
      ? prisma.gymSession.count({ where: { userId: user.id } })
      : Promise.resolve(null),
    allTime
      ? prisma.muscleHit.aggregate({
          where: { session: { userId: user.id } },
          _count: true,
          _sum: { intensity: true },
        })
      : Promise.resolve(null),
    allTime
      ? prisma.sportSession.aggregate({
          where: { userId: user.id },
          _sum: { durationMinutes: true, distanceKm: true, distanceMeters: true },
        })
      : Promise.resolve(null),
    allTime
      ? prisma.sportSession.count({ where: { userId: user.id } })
      : Promise.resolve(null),
    prisma.gymSession.findMany({
      where: { userId: user.id },
      select: { date: true },
      orderBy: { date: "desc" },
    }),
    prisma.supplementIntake.findMany({
      where: { userId: user.id },
      select: { date: true },
      orderBy: { date: "desc" },
    }),
    prisma.sportSession.findMany({
      where: { userId: user.id },
      select: { date: true },
      orderBy: { date: "desc" },
    }),
    allTime
      ? prisma.muscleHit.groupBy({
          by: ["muscleName"],
          where: { session: { userId: user.id } },
          _sum: { intensity: true },
          _count: true,
        })
      : Promise.resolve(null),
  ]);

  const dailyMap = new Map(
    buildDailySkeleton(rangeDays, today).map((point) => [point.date, point]),
  );

  let totalHits = 0;
  let totalGymLoad = 0;
  const topMap = new Map<string, TopMuscle & { dates: Set<string> }>();

  for (const session of chartSessions) {
    const point = dailyMap.get(session.date);
    if (point) point.workouts += 1;
    for (const hit of session.hits) {
      totalHits += 1;
      totalGymLoad += hit.intensity;
      if (point) point.gymLoad += hit.intensity;
      const existing = topMap.get(hit.muscleName) ?? {
        name: hit.muscleName,
        load: 0,
        hits: 0,
        days: 0,
        avgIntensity: 0,
        dates: new Set<string>(),
      };
      existing.load += hit.intensity;
      existing.hits += 1;
      existing.dates.add(session.date);
      topMap.set(hit.muscleName, existing);
    }
  }

  for (const intake of chartSupplements) {
    const point = dailyMap.get(intake.date);
    if (point) point.supplements += 1;
  }

  let totalSportMinutes = 0;
  let totalSportKm = 0;
  for (const session of chartSports) {
    const point = dailyMap.get(session.date);
    if (point) point.sports += 1;
    if (session.durationMinutes != null) totalSportMinutes += session.durationMinutes;
    if (session.distanceKm != null) totalSportKm += session.distanceKm;
    if (session.distanceMeters != null) {
      totalSportKm += session.distanceMeters / 1000;
    }
  }

  let previousLoad = 0;
  for (const session of previousSessions) {
    for (const hit of session.hits) previousLoad += hit.intensity;
  }

  const supplementDays = new Set(chartSupplements.map((item) => item.date));
  const previousSupplementDays = new Set(
    previousSupplements.map((item) => item.date),
  );

  if (allTime && hitAgg && workoutCount != null && sportCount != null && sportAgg) {
    totalHits = hitAgg._count;
    totalGymLoad = hitAgg._sum.intensity ?? 0;
    totalSportMinutes = sportAgg._sum.durationMinutes ?? 0;
    totalSportKm =
      (sportAgg._sum.distanceKm ?? 0) + (sportAgg._sum.distanceMeters ?? 0) / 1000;
  }

  if (allTime && topHits) {
    topMap.clear();
    for (const row of topHits) {
      topMap.set(row.muscleName, {
        name: row.muscleName,
        load: row._sum.intensity ?? 0,
        hits: row._count,
        days: 0,
        avgIntensity: 0,
        dates: new Set(),
      });
    }
  }

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

  const totalWorkouts = allTime && workoutCount != null ? workoutCount : chartSessions.length;
  const totalSports = allTime && sportCount != null ? sportCount : chartSports.length;
  const allTimeSupplementDays = allTime
    ? uniqueDates(allSupplementDates.map((item) => item.date)).length
    : supplementDays.size;

  return {
    days: allTime ? 0 : rangeDays,
    periodLabel: periodLabel(allTime ? 9999 : rangeDays),
    chartLabel: allTime
      ? `Gym load · last ${ANALYTICS_ALL_CHART_DAYS} days`
      : "Gym load",
    totalWorkouts,
    totalHits,
    totalGymLoad,
    totalSports,
    totalSportMinutes,
    totalSportKm: Math.round(totalSportKm * 10) / 10,
    supplementDays: allTimeSupplementDays,
    supplementStreak: computeStreak(
      uniqueDates(allSupplementDates.map((item) => item.date)),
      new Date(`${today}T12:00:00`),
    ),
    gymStreak: computeStreak(
      uniqueDates(allGymDates.map((item) => item.date)),
      new Date(`${today}T12:00:00`),
    ),
    sportStreak: computeStreak(
      uniqueDates(allSportDates.map((item) => item.date)),
      new Date(`${today}T12:00:00`),
    ),
    trends: allTime
      ? {
          workouts: null,
          gymLoad: null,
          sports: null,
          supplements: null,
        }
      : {
          workouts: percentChange(chartSessions.length, previousSessions.length),
          gymLoad: percentChange(totalGymLoad, previousLoad),
          sports: percentChange(chartSports.length, previousSports.length),
          supplements: percentChange(
            supplementDays.size,
            previousSupplementDays.size,
          ),
        },
    daily: Array.from(dailyMap.values()),
    topMuscles,
  };
}

export async function getNotebookExercises(): Promise<NotebookExercise[]> {
  const user = await requireUser();
  const rows = await prisma.customExercise.findMany({
    where: {
      userId: user.id,
      OR: [
        { prWeight: { not: null } },
        { snapshots: { some: { prWeight: { not: null } } } },
      ],
    },
    select: {
      id: true,
      name: true,
      prWeight: true,
      prReps: true,
      prDate: true,
      dualWeights: true,
    },
    orderBy: { name: "asc" },
  });
  return rows;
}

function toProgressionPoint(
  date: string,
  prWeight: number | null,
  prReps: number | null,
  dualWeights: boolean,
): ProgressionPoint | null {
  if (prWeight == null) return null;
  return {
    date,
    prWeight,
    prReps,
    estimatedOneRm:
      prReps != null ? estimatedOneRm(prWeight, prReps) : prWeight,
    dualWeights,
  };
}

export async function getExerciseProgression(
  exerciseId: string,
): Promise<ProgressionPoint[]> {
  const user = await requireUser();
  const id = exerciseId.trim();
  if (!id) return [];

  const exercise = await prisma.customExercise.findFirst({
    where: { id, userId: user.id },
    include: {
      snapshots: { orderBy: { date: "asc" } },
    },
  });
  if (!exercise) return [];

  const points: ProgressionPoint[] = exercise.snapshots
    .map((snap) =>
      toProgressionPoint(
        snap.date,
        snap.prWeight,
        snap.prReps,
        exercise.dualWeights,
      ),
    )
    .filter((point): point is ProgressionPoint => point != null);

  const last = points[points.length - 1];
  const pointDate = exercise.prDate ?? (await getRequestToday());
  const current = toProgressionPoint(
    pointDate,
    exercise.prWeight,
    exercise.prReps,
    exercise.dualWeights,
  );
  const differs =
    current != null &&
    (!last ||
      last.prWeight !== current.prWeight ||
      last.prReps !== current.prReps);

  if (current && differs) {
    const existingIndex = points.findIndex((item) => item.date === current.date);
    if (existingIndex >= 0) points[existingIndex] = current;
    else points.push(current);
    points.sort((a, b) => a.date.localeCompare(b.date));
  }

  return points;
}

export async function exportMyData() {
  const user = await requireUser();

  const [sessions, supplements, sports, muscles, customExercises] =
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
      dualWeights: item.dualWeights,
      snapshots: item.snapshots.map((snap) => ({
        date: snap.date,
        workingWeight: snap.workingWeight,
        workingReps: snap.workingReps,
        prWeight: snap.prWeight,
        prReps: snap.prReps,
      })),
    })),
    preferences: {
      massUnit: user.massUnit,
      distanceUnit: user.distanceUnit,
    },
  };
}
