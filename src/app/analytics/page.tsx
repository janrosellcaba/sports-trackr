import {
  getAnalyticsSummary,
  getExerciseNames,
} from "@/app/actions/analytics";
import { ActivityChart } from "@/components/analytics/ActivityChart";
import { ExerciseProgressionChart } from "@/components/analytics/ExerciseProgressionChart";
import { KpiGrid } from "@/components/analytics/KpiGrid";
import { AppShell } from "@/components/layout/AppShell";

export default async function AnalyticsPage() {
  const [summary, exerciseNames] = await Promise.all([
    getAnalyticsSummary(30),
    getExerciseNames(),
  ]);

  return (
    <AppShell subtitle="Volume, frequency, and strength trends">
      <div className="space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">
          Analytics
        </h2>
        <p className="text-sm text-neutral-400">
          Last {summary.days} days compared with the prior period.
        </p>
      </div>

      <KpiGrid summary={summary} />
      <ActivityChart data={summary.daily} />
      <ExerciseProgressionChart exerciseNames={exerciseNames} />
    </AppShell>
  );
}
