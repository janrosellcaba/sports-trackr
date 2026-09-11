import {
  getAnalyticsSummary,
  getExerciseNames,
} from "@/app/actions/analytics";
import { ActivityChart } from "@/components/analytics/ActivityChart";
import { ExerciseProgressionChart } from "@/components/analytics/ExerciseProgressionChart";
import { ExportDataButton } from "@/components/analytics/ExportDataButton";
import { KpiGrid } from "@/components/analytics/KpiGrid";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function AnalyticsPage() {
  const [summary, exerciseNames] = await Promise.all([
    getAnalyticsSummary(30),
    getExerciseNames(),
  ]);

  return (
    <AppShell wide>
      <PageHeader
        title="Analytics"
        subtitle={`Last ${summary.days} days compared with the prior period.`}
      />

      <KpiGrid summary={summary} />
      <ExportDataButton />
      <ActivityChart data={summary.daily} />
      <ExerciseProgressionChart exerciseNames={exerciseNames} />
    </AppShell>
  );
}
