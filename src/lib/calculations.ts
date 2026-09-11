export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function sessionDurationMinutes(start: Date, end: Date | null): number {
  if (!end) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

export function setVolume(weight: number, reps: number): number {
  return weight * reps;
}

export function workoutTonnage(
  sets: { weight: number; reps: number }[],
): number {
  return sets.reduce((sum, set) => sum + setVolume(set.weight, set.reps), 0);
}

/** Epley estimated 1RM */
export function estimatedOneRm(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export function computeStreak(dates: Date[], now = new Date()): number {
  const daysWithActivity = new Set(dates.map(toDateKey));
  if (daysWithActivity.size === 0) return 0;

  let cursor = startOfDay(now);
  if (!daysWithActivity.has(toDateKey(cursor))) {
    cursor = addDays(cursor, -1);
  }

  let streak = 0;
  while (daysWithActivity.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function formatRestTime(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export const REST_PRESETS = [60, 90, 120] as const;
