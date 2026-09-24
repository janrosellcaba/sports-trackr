import { addDaysISO, isDateKey } from "@/lib/calculations";
import { paceToSeconds } from "@/lib/units";
import type { ShapePoint } from "@/types/trackr";

/** Shape fades by half after two quiet weeks, so time off shows up. */
export const SHAPE_HALF_LIFE_DAYS = 14;
export const SHAPE_RETENTION = 0.5 ** (1 / SHAPE_HALF_LIFE_DAYS);
/** A logged sport with no time or pace still counts as showing up. */
export const SPORT_SESSION_FLOOR = 6;
export const PR_SHAPE_BONUS = 4;

export type { ShapePoint };

export type ShapeSportInput = {
  durationMinutes: number | null;
  distanceKm: number | null;
  pace: string | null;
  effort: string | null;
};

export function sportShapePoints(sport: ShapeSportInput): number {
  const minutes = sportMinutes(sport);
  const scaled = (minutes / 10) * effortFactor(sport.effort);
  if (minutes <= 0) return SPORT_SESSION_FLOOR;
  return scaled;
}

export function buildShapeSeries(
  doses: Map<string, number>,
  today: string,
): ShapePoint[] {
  let start: string | null = null;
  for (const date of doses.keys()) {
    if (!isDateKey(date) || date > today) continue;
    if (start == null || date < start) start = date;
  }
  if (!start) return [];

  const points: ShapePoint[] = [];
  let score = 0;
  let cursor = start;
  while (cursor <= today) {
    score = score * SHAPE_RETENTION + (doses.get(cursor) ?? 0);
    points.push({ date: cursor, score });
    cursor = addDaysISO(cursor, 1);
  }
  return points;
}

export function shapeReadout(points: ShapePoint[]): {
  score: number;
  weekChange: number | null;
} | null {
  const current = points[points.length - 1];
  if (!current) return null;
  const score = Math.round(current.score);
  const weekAgo = addDaysISO(current.date, -7);
  const then = points.find((point) => point.date === weekAgo);
  if (!then) return { score, weekChange: null };
  return { score, weekChange: score - Math.round(then.score) };
}

function sportMinutes(sport: ShapeSportInput): number {
  if (sport.durationMinutes != null && sport.durationMinutes > 0) {
    return sport.durationMinutes;
  }
  if (sport.distanceKm != null && sport.distanceKm > 0 && sport.pace) {
    const secondsPerKm = paceToSeconds(sport.pace);
    if (secondsPerKm != null) return (sport.distanceKm * secondsPerKm) / 60;
  }
  return 0;
}

function effortFactor(effort: string | null): number {
  if (effort === "HARD") return 1.2;
  if (effort === "EASY") return 0.85;
  return 1;
}
