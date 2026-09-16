"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { KpiGrid } from "@/components/analytics/KpiGrid";
import { TopMuscles } from "@/components/analytics/TopMuscles";
import { PAGE_TITLE } from "@/lib/ui";
import type { AnalyticsPeriod, AnalyticsSummary, NotebookExercise } from "@/types/trackr";

const ActivityChart = dynamic(
  () => import("@/components/analytics/ActivityChart").then((mod) => mod.ActivityChart),
  { ssr: false, loading: () => <ChartSkeleton label="Gym load" /> },
);

const ExerciseProgressionChart = dynamic(
  () =>
    import("@/components/analytics/ExerciseProgressionChart").then(
      (mod) => mod.ExerciseProgressionChart,
    ),
  { ssr: false, loading: () => <ChartSkeleton label="Progression" /> },
);

const PERIODS: { key: AnalyticsPeriod; label: string; href: string }[] = [
  { key: 7, label: "7d", href: "/analytics?period=7" },
  { key: 30, label: "30d", href: "/analytics" },
  { key: 90, label: "90d", href: "/analytics?period=90" },
  { key: 0, label: "All", href: "/analytics?period=0" },
];

export function AnalyticsView({
  summary,
  exercises,
  period,
}: {
  summary: AnalyticsSummary;
  exercises: NotebookExercise[];
  period: AnalyticsPeriod;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={PAGE_TITLE}>Analytics</h1>
          <p className="mt-1 text-sm text-muted">{summary.periodLabel}</p>
        </div>
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-chip/80 p-1">
          {PERIODS.map((item) => {
            const active = period === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-bold ${
                  active
                    ? "bg-paper text-ink shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="space-y-5">
        <KpiGrid summary={summary} />
        <ActivityChart data={summary.daily} chartLabel={summary.chartLabel} />
        <TopMuscles items={summary.topMuscles} />
        <ExerciseProgressionChart exercises={exercises} />
      </div>
    </div>
  );
}

function ChartSkeleton({ label }: { label: string }) {
  return (
    <section className="h-56 rounded-2xl border border-line bg-paper p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
    </section>
  );
}
