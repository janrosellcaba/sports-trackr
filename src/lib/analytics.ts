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
