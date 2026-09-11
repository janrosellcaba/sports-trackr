"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import type {
  AnalyticsSummary,
  DailyActivityPoint,
  ProgressionPoint,
  WorkoutHistoryFeed,
} from "@/types/trackr";

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function sessionDurationMinutes(start: Date, end: Date | null): number {
  if (!end) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

function setVolume(weight: number, reps: number): number {
  return weight * reps;
}

/** Epley estimated 1RM */
function estimatedOneRm(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function buildDailySkeleton(days: number, end: Date): DailyActivityPoint[] {
  const points: DailyActivityPoint[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    points.push({
      date: toDateKey(addDays(end, -i)),
      gymMinutes: 0,
      cardioMinutes: 0,
      volumeKg: 0,
    });
  }
  return points;
}

async function computeSupplementStreak(userId: string): Promise<number> {
  const intakes = await prisma.supplementIntake.findMany({
    where: { userId },
    select: { date: true },
    orderBy: { date: "desc" },
    take: 365,
  });

  const daysWithIntake = new Set(intakes.map((item) => toDateKey(item.date)));
  if (daysWithIntake.size === 0) return 0;

  let cursor = startOfDay(new Date());
  if (!daysWithIntake.has(toDateKey(cursor))) {
    cursor = addDays(cursor, -1);
  }

  let streak = 0;
  while (daysWithIntake.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export async function getAnalyticsSummary(
  days = 30,
): Promise<AnalyticsSummary> {
  const user = await requireUser();
  const rangeDays = Math.max(7, Math.min(days, 90));
  const chartDays = rangeDays >= 30 ? 30 : 14;
  const end = startOfDay(new Date());
  const rangeStart = startOfDay(addDays(end, -(rangeDays - 1)));
  const previousStart = startOfDay(addDays(rangeStart, -rangeDays));
  const chartStart = startOfDay(addDays(end, -(chartDays - 1)));

  const [sessions, cardio, supplements, previousSessions, previousCardio, previousSupplements] =
    await Promise.all([
      prisma.workoutSession.findMany({
        where: {
          userId: user.id,
          endTime: { not: null },
          startTime: { gte: rangeStart },
        },
        include: {
          exercises: {
            include: { sets: true },
          },
        },
      }),
      prisma.cardioActivity.findMany({
        where: { userId: user.id, date: { gte: rangeStart } },
      }),
      prisma.supplementIntake.findMany({
        where: { userId: user.id, date: { gte: rangeStart } },
        select: { date: true },
      }),
      prisma.workoutSession.findMany({
        where: {
          userId: user.id,
          endTime: { not: null },
          startTime: { gte: previousStart, lt: rangeStart },
        },
        include: {
          exercises: { include: { sets: true } },
        },
      }),
      prisma.cardioActivity.findMany({
        where: {
          userId: user.id,
          date: { gte: previousStart, lt: rangeStart },
        },
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
    buildDailySkeleton(chartDays, end).map((point) => [point.date, point]),
  );

  let totalVolumeKg = 0;
  for (const session of sessions) {
    const key = toDateKey(session.startTime);
    const point = dailyMap.get(key);
    const gymMinutes = sessionDurationMinutes(session.startTime, session.endTime);
    if (point && session.startTime >= chartStart) {
      point.gymMinutes += gymMinutes;
    }

    for (const exercise of session.exercises) {
      for (const set of exercise.sets) {
        const volume = setVolume(set.weight, set.reps);
        totalVolumeKg += volume;
        if (point && session.startTime >= chartStart) {
          point.volumeKg += volume;
        }
      }
    }
  }

  let totalCardioMinutes = 0;
  for (const activity of cardio) {
    totalCardioMinutes += activity.durationMinutes;
    const point = dailyMap.get(toDateKey(activity.date));
    if (point && activity.date >= chartStart) {
      point.cardioMinutes += activity.durationMinutes;
    }
  }

  let previousVolume = 0;
  for (const session of previousSessions) {
    for (const exercise of session.exercises) {
      for (const set of exercise.sets) {
        previousVolume += setVolume(set.weight, set.reps);
      }
    }
  }

  const previousCardioMinutes = previousCardio.reduce(
    (sum, activity) => sum + activity.durationMinutes,
    0,
  );

  const supplementDays = new Set(supplements.map((item) => toDateKey(item.date)));
  const previousSupplementDays = new Set(
    previousSupplements.map((item) => toDateKey(item.date)),
  );

  const supplementStreak = await computeSupplementStreak(user.id);

  return {
    days: rangeDays,
    totalSessions: sessions.length,
    totalCardioMinutes,
    totalVolumeKg: Math.round(totalVolumeKg),
    supplementComplianceDays: supplementDays.size,
    supplementStreak,
    trends: {
      sessions: percentChange(sessions.length, previousSessions.length),
      cardioMinutes: percentChange(totalCardioMinutes, previousCardioMinutes),
      volumeKg: percentChange(totalVolumeKg, previousVolume),
      supplements: percentChange(supplementDays.size, previousSupplementDays.size),
    },
    daily: Array.from(dailyMap.values()).map((point) => ({
      ...point,
      volumeKg: Math.round(point.volumeKg),
    })),
  };
}

export async function getWorkoutHistory(
  limit = 20,
): Promise<WorkoutHistoryFeed> {
  const user = await requireUser();
  const take = Math.max(1, Math.min(limit, 100));

  const [sessions, activities] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { userId: user.id, endTime: { not: null } },
      orderBy: { startTime: "desc" },
      take,
      include: {
        exercises: {
          orderBy: { order: "asc" },
          include: {
            sets: { orderBy: { setNumber: "asc" } },
          },
        },
      },
    }),
    prisma.cardioActivity.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take,
    }),
  ]);

  return {
    sessions: sessions.map((session) => {
      const exercises = session.exercises.map((exercise) => {
        const volumeKg = exercise.sets.reduce(
          (sum, set) => sum + setVolume(set.weight, set.reps),
          0,
        );
        return {
          id: exercise.id,
          machineName: exercise.machineName,
          order: exercise.order,
          volumeKg: Math.round(volumeKg),
          sets: exercise.sets.map((set) => ({
            id: set.id,
            setNumber: set.setNumber,
            weight: set.weight,
            reps: set.reps,
            rpe: set.rpe,
          })),
        };
      });

      const totalVolumeKg = exercises.reduce(
        (sum, exercise) => sum + exercise.volumeKg,
        0,
      );
      const setCount = exercises.reduce(
        (sum, exercise) => sum + exercise.sets.length,
        0,
      );

      return {
        id: session.id,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime!.toISOString(),
        notes: session.notes,
        durationMinutes: sessionDurationMinutes(
          session.startTime,
          session.endTime,
        ),
        totalVolumeKg,
        exerciseCount: exercises.length,
        setCount,
        exercises,
      };
    }),
    activities: activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      durationMinutes: activity.durationMinutes,
      intensity: activity.intensity,
      notes: activity.notes,
      date: activity.date.toISOString(),
    })),
  };
}

export async function getExerciseNames(): Promise<string[]> {
  const user = await requireUser();
  const rows = await prisma.exerciseLog.findMany({
    where: { session: { userId: user.id } },
    select: { machineName: true },
    distinct: ["machineName"],
    orderBy: { machineName: "asc" },
  });

  return rows.map((row) => row.machineName);
}

export async function getExerciseProgression(
  machineName: string,
): Promise<ProgressionPoint[]> {
  const user = await requireUser();
  const trimmed = machineName.trim();
  if (!trimmed) return [];

  const logs = await prisma.exerciseLog.findMany({
    where: { machineName: trimmed, session: { userId: user.id } },
    include: {
      session: { select: { startTime: true, endTime: true } },
      sets: true,
    },
    orderBy: { session: { startTime: "asc" } },
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

    const key = toDateKey(log.session.startTime);
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

export async function deleteWorkoutSession(sessionId: string): Promise<void> {
  const user = await requireUser();
  const result = await prisma.workoutSession.deleteMany({
    where: { id: sessionId, userId: user.id },
  });

  if (result.count === 0) {
    throw new Error("Session not found.");
  }
  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/analytics");
}
