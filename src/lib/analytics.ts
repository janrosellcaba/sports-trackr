import { addDaysISO, parseISODate } from "@/lib/calculations";

export const ANALYTICS_PERIODS = [7, 30, 90, 0] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];
export const ANALYTICS_ALL_CHART_DAYS = 90;

export type ActivityKind = "out" | "rest" | "gym" | "sport" | "both";

export type WeekDayCell = {
  date: string;
  kind: ActivityKind;
};

export type ActivityWeek = {
  start: string;
  days: WeekDayCell[];
};

type WeekPoint = {
  date: string;
  workouts: number;
  sports: number;
};

export function isAnalyticsPeriod(value: unknown): value is AnalyticsPeriod {
  return (
    typeof value === "number" &&
    (ANALYTICS_PERIODS as readonly number[]).includes(value)
  );
}

export function parseAnalyticsPeriod(value: unknown): AnalyticsPeriod {
  const numeric = typeof value === "string" ? Number(value) : value;
  return isAnalyticsPeriod(numeric) ? numeric : 30;
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function periodLabel(days: number): string {
  if (days <= 7) return "Last 7 days";
  if (days <= 30) return "Last 30 days";
  if (days <= 90) return "Last 90 days";
  return "All time";
}

export function uniqueCount(dates: Iterable<string>): number {
  return new Set(dates).size;
}

export function unionCount(
  left: Iterable<string>,
  right: Iterable<string>,
): number {
  return new Set([...left, ...right]).size;
}

export function perWeekRate(count: number, days: number): number | null {
  if (days <= 0) return null;
  return Math.round((count / days) * 7 * 10) / 10;
}

export function compareCounts(current: number, previous: number): string | null {
  if (previous <= 0) return null;
  return `${current} vs ${previous}`;
}

export function weekStrip(
  date: string,
  today: string,
  gymDates: Iterable<string>,
  sportDates: Iterable<string>,
): WeekDayCell[] {
  const gym = new Set(gymDates);
  const sport = new Set(sportDates);
  const start = mondayOnOrBefore(date);
  const days: WeekDayCell[] = [];
  for (let index = 0; index < 7; index += 1) {
    const day = addDaysISO(start, index);
    if (day > today) {
      days.push({ date: day, kind: "out" });
      continue;
    }
    days.push({
      date: day,
      kind: activityKind({
        date: day,
        workouts: gym.has(day) ? 1 : 0,
        sports: sport.has(day) ? 1 : 0,
      }),
    });
  }
  return days;
}

export function mondayOnOrBefore(iso: string): string {
  const day = parseISODate(iso).getDay();
  const offset = day === 0 ? 6 : day - 1;
  return addDaysISO(iso, -offset);
}

export function activityKind(point: WeekPoint | undefined): ActivityKind {
  if (!point) return "out";
  const gym = point.workouts > 0;
  const sport = point.sports > 0;
  if (gym && sport) return "both";
  if (gym) return "gym";
  if (sport) return "sport";
  return "rest";
}

export function buildActivityWeeks(daily: WeekPoint[]): ActivityWeek[] {
  if (daily.length === 0) return [];
  const byDate = new Map(daily.map((point) => [point.date, point]));
  const last = daily[daily.length - 1]?.date;
  if (!last) return [];
  const weeks: ActivityWeek[] = [];
  let cursor = mondayOnOrBefore(daily[0]?.date ?? last);
  while (cursor <= last) {
    const days: WeekDayCell[] = [];
    for (let i = 0; i < 7; i += 1) {
      const date = addDaysISO(cursor, i);
      days.push({ date, kind: activityKind(byDate.get(date)) });
    }
    weeks.push({ start: cursor, days });
    cursor = addDaysISO(cursor, 7);
  }
  return weeks;
}

export function weekCounts(week: ActivityWeek): {
  gym: number;
  sport: number;
  rest: number;
  activity: number;
} {
  let gym = 0;
  let sport = 0;
  let rest = 0;
  let activity = 0;
  for (const day of week.days) {
    if (day.kind === "out") continue;
    if (day.kind === "rest") {
      rest += 1;
      continue;
    }
    activity += 1;
    if (day.kind === "gym" || day.kind === "both") gym += 1;
    if (day.kind === "sport" || day.kind === "both") sport += 1;
  }
  return { gym, sport, rest, activity };
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export type MonthKey = string; // "YYYY-MM"

export function isMonthKey(value: unknown): value is MonthKey {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function monthLabel(key: MonthKey): string {
  const [year, month] = key.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function shiftMonth(key: MonthKey, delta: number): MonthKey {
  const [year, month] = key.split("-").map(Number);
  const index = year * 12 + (month - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

export function monthStart(key: MonthKey): string {
  return `${key}-01`;
}

export function monthEnd(key: MonthKey): string {
  const [year, month] = key.split("-").map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${key}-${String(last).padStart(2, "0")}`;
}

/** A valid month that is not in the future, or null. */
export function parseAnalyticsMonth(value: unknown, today: string): MonthKey | null {
  if (!isMonthKey(value)) return null;
  return value <= today.slice(0, 7) ? value : null;
}

/** Months from the current one back to the first activity, newest first. */
export function monthOptions(
  firstDate: string | null,
  today: string,
): { key: MonthKey; label: string }[] {
  const current = today.slice(0, 7);
  const first = firstDate && firstDate.length >= 7 ? firstDate.slice(0, 7) : current;
  const options: { key: MonthKey; label: string }[] = [];
  let key = current;
  while (key >= first && options.length < 240) {
    options.push({ key, label: monthLabel(key) });
    key = shiftMonth(key, -1);
  }
  return options;
}
