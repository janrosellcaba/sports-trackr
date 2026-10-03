import { formatLift } from "@/lib/catalog";
import { buildActivityWeeks, perWeekRate, weekCounts } from "@/lib/analytics";
import { shapeReadout } from "@/lib/shape";
import { kmToDisplay, kgToDisplay, trimNumber, type DistanceUnit, type MassUnit } from "@/lib/units";
import type { AnalyticsSummary, NotebookExercise } from "@/types/trackr";

export function trainerPayload(
  summary: AnalyticsSummary,
  exercises: NotebookExercise[],
  massUnit: MassUnit,
  distanceUnit: DistanceUnit,
) {
  return {
    period: summary.periodLabel,
    units: { mass: massUnit, distance: distanceUnit },
    legend: {
      gymLoad: "Sum of muscle intensities (1–5) that day",
      intensity: "1 Light → 5 Wrecked",
      activityDay: "A day with gym, sport, or both",
      sportDay: "A day with at least one sport session",
    },
    activity: {
      days: summary.activityDays,
      restDays: summary.days ? summary.restDays : null,
      perWeek: summary.days ? perWeekRate(summary.activityDays, summary.days) : null,
      gymDays: summary.gymDays,
      sportDays: summary.sportDays,
      previousDays: summary.previous?.activityDays ?? null,
    },
    gym: {
      days: summary.gymDays,
      load: summary.totalGymLoad,
      hits: summary.totalHits,
      streak: summary.gymStreak,
      previousLoad: summary.previous?.gymLoad ?? null,
    },
    sports: {
      days: summary.sportDays,
      sessions: summary.totalSports,
      perWeek: summary.days ? perWeekRate(summary.sportDays, summary.days) : null,
      minutes: summary.totalSportMinutes,
      distance: summary.totalSportKm
        ? trimNumber(kmToDisplay(summary.totalSportKm, distanceUnit))
        : 0,
    },
    supplements: {
      days: summary.supplementDays,
      streak: summary.supplementStreak,
    },
    shape: shapePayload(summary.shape),
    bodyWeight: summary.weights.map((point) => ({
      date: point.date,
      kg: point.weightKg,
      display: trimNumber(kgToDisplay(point.weightKg, massUnit)),
    })),
    topMuscles: summary.topMuscles,
    personalRecords: exercises
      .filter((item) => item.prWeight != null)
      .map((item) => ({
        name: item.name,
        lift: formatLift(item.prWeight, item.prReps, massUnit, item.dualWeights),
        date: item.prDate,
      })),
    daily: summary.daily,
    weeks: buildActivityWeeks(summary.daily).map((week) => ({
      start: week.start,
      ...weekCounts(week),
    })),
  };
}

function shapePayload(points: AnalyticsSummary["shape"]) {
  const readout = shapeReadout(points);
  if (!readout) return null;
  return { score: readout.score, weekChange: readout.weekChange };
}

export type TrainerPayload = ReturnType<typeof trainerPayload>;
