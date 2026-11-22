import type { Metadata } from "next";
import {
  getAnalyticsSummary,
  getMuscleRecovery,
  getNotebookExercises,
} from "@/app/actions/analytics";
import { monthOptions, parseAnalyticsMonth, parseAnalyticsPeriod } from "@/lib/analytics";
import { getRequestToday } from "@/lib/request-today";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; month?: string }>;
}) {
  const params = await searchParams;
  const period = parseAnalyticsPeriod(params.period);
  const today = await getRequestToday();
  const month = parseAnalyticsMonth(params.month, today);
  const [summary, exercises, recovery] = await Promise.all([
    getAnalyticsSummary(period, undefined, month),
    getNotebookExercises(),
    getMuscleRecovery(),
  ]);

  return (
    <AnalyticsView
      summary={summary}
      exercises={exercises}
      recovery={recovery}
      period={period}
      month={month}
      months={monthOptions(summary.firstActivityDate, today)}
    />
  );
}
