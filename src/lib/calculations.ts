import { TODAY_COOKIE } from "@/lib/constants";

export function getTodayLocalDateISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isDateKey(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function parseISODate(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return startOfDay(new Date(NaN));
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (!isDateKey(iso)) return startOfDay(new Date(NaN));
  return date;
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

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatDisplayDate(iso: string): string {
  const date = parseISODate(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function formatChartDate(iso: string): string {
  const date = parseISODate(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function formatDisplayDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${formatDisplayDate(getTodayLocalDateISO(date))} · ${hours}:${minutes}`;
}

export function readTodayCookie(value: string | undefined | null): string | null {
  if (!value || !isDateKey(value)) return null;
  return value;
}

export function todayCookieHeader(today: string): string {
  return `${TODAY_COOKIE}=${today}; Path=/; Max-Age=172800; SameSite=Lax`;
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
