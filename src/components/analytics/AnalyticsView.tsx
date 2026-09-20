"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { BestLifts } from "@/components/analytics/BestLifts";
import { KpiGrid } from "@/components/analytics/KpiGrid";
import { TopMuscles } from "@/components/analytics/TopMuscles";
import { PAGE_TITLE, SEGMENT_TRACK, segmentItemClass } from "@/lib/ui";
import type { AnalyticsPeriod, AnalyticsSummary, NotebookExercise } from "@/types/trackr";

const ActivityChart = dynamic(
  () => import("@/components/analytics/ActivityChart").then((mod) => mod.ActivityChart),
  { ssr: false, loading: () => <ChartSkeleton label="Load" /> },
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className={PAGE_TITLE}>Analytics</h1>
        <div className={`${SEGMENT_TRACK} grid-cols-4 sm:w-72`}>
          {PERIODS.map((item) => {
            const active = period === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={segmentItemClass(active)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="space-y-5">
        <KpiGrid summary={summary} />
        <div className="grid gap-5 lg:grid-cols-2">
          <ActivityChart data={summary.daily} chartLabel="Load" />
          <TopMuscles items={summary.topMuscles} />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <BestLifts exercises={exercises} />
          <ExerciseProgressionChart exercises={exercises} />
        </div>
      </div>
    </div>
  );
}

function ChartSkeleton({ label }: { label: string }) {
  return (
    <section className="card-lux h-56 rounded-[1.35rem] p-4">
      <p className="text-[11px] font-semibold tracking-[0.18em] text-muted uppercase">
        {label}
      </p>
    </section>
  );
}
