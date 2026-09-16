export const ANALYTICS_PERIODS = [7, 30, 90, 0] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];
export const ANALYTICS_ALL_CHART_DAYS = 90;

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
