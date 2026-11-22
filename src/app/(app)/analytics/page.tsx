import type { Metadata } from "next";
import {
  getAnalyticsSummary,
  getMuscleRecovery,
  getNotebookExercises,
} from "@/app/actions/analytics";
import { parseAnalyticsPeriod } from "@/lib/analytics";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = parseAnalyticsPeriod(params.period);
  const [summary, exercises, recovery] = await Promise.all([
    getAnalyticsSummary(period),
    getNotebookExercises(),
    getMuscleRecovery(),
  ]);

  return (
    <AnalyticsView
      summary={summary}
      exercises={exercises}
      recovery={recovery}
      period={period}
    />
  );
}
