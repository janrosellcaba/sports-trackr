export function getTodayLocalDateISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function toDateKey(date: Date): string {
  return getTodayLocalDateISO(date);
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

export function addDaysISO(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return getTodayLocalDateISO(date);
}

export function parseISODate(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return startOfDay(new Date(iso));
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function formatDisplayDate(iso: string): string {
  const date = parseISODate(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Epley estimated 1RM */
export function estimatedOneRm(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

export function computeStreak(dateKeys: string[], now = new Date()): number {
  const daysWithActivity = new Set(dateKeys);
  if (daysWithActivity.size === 0) return 0;

  let cursor = getTodayLocalDateISO(startOfDay(now));
  if (!daysWithActivity.has(cursor)) {
    cursor = addDaysISO(cursor, -1);
  }

  let streak = 0;
  while (daysWithActivity.has(cursor)) {
    streak += 1;
    cursor = addDaysISO(cursor, -1);
  }

  return streak;
}
