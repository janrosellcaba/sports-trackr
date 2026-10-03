"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnalyticsCopyMenu } from "@/components/analytics/AnalyticsCopyMenu";
import { BestLifts } from "@/components/analytics/BestLifts";
import { KpiGrid } from "@/components/analytics/KpiGrid";
import { TopMuscles } from "@/components/analytics/TopMuscles";
import { WeekGrid } from "@/components/analytics/WeekGrid";
import { NoticeToast, type Notice } from "@/components/ui/NoticeToast";
import { useUnits } from "@/components/units/UnitsProvider";
import { buildAnalyticsAiBrief } from "@/lib/analyticsAiBrief";
import { copyText } from "@/lib/clipboard";
import { trainerPayload } from "@/lib/trainerPayload";
import { PAGE_TITLE, SEGMENT_TRACK, blurOnPointerUp, segmentItemClass } from "@/lib/ui";
import type { AnalyticsPeriod, AnalyticsSummary, NotebookExercise } from "@/types/trackr";

const ActivityChart = dynamic(
  () => import("@/components/analytics/ActivityChart").then((mod) => mod.ActivityChart),
  { ssr: false, loading: () => <ChartSkeleton label="Activity" /> },
);

const ExerciseProgressionChart = dynamic(
  () =>
    import("@/components/analytics/ExerciseProgressionChart").then(
      (mod) => mod.ExerciseProgressionChart,
    ),
  { ssr: false, loading: () => <ChartSkeleton label="Progression" /> },
);

const WeightChart = dynamic(
  () => import("@/components/analytics/WeightChart").then((mod) => mod.WeightChart),
  { ssr: false, loading: () => <ChartSkeleton label="Body weight" /> },
);

const ShapeChart = dynamic(
  () => import("@/components/analytics/ShapeChart").then((mod) => mod.ShapeChart),
  { ssr: false, loading: () => <ChartSkeleton label="Shape" /> },
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
  const { massUnit, distanceUnit } = useUnits();
  const [notice, setNotice] = useState<Notice | null>(null);
  const payload = trainerPayload(summary, exercises, massUnit, distanceUnit);
  const dismissNotice = useCallback(() => setNotice(null), []);

  function flash(text: string) {
    setNotice({ id: Date.now(), text });
  }

  async function handleCopyJson() {
    try {
      await copyText(JSON.stringify(payload, null, 2));
      flash("JSON copied.");
    } catch {
      flash("Could not copy");
    }
  }

  async function handleCopyAi() {
    try {
      await copyText(buildAnalyticsAiBrief(payload));
      flash("AI brief copied — paste it into a chat.");
    } catch {
      flash("Could not copy");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className={PAGE_TITLE}>Analytics</h1>
        <AnalyticsCopyMenu onCopyJson={handleCopyJson} onCopyAi={handleCopyAi} />
      </div>
      <ShapeChart points={summary.shape} />
      <div className={`${SEGMENT_TRACK} grid-cols-4 sm:w-72`}>
        {PERIODS.map((item) => {
          const active = period === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onPointerUp={blurOnPointerUp}
              className={segmentItemClass(active)}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="space-y-6">
        <KpiGrid summary={summary} />
        <div className="grid gap-6 lg:grid-cols-2">
          <ActivityChart data={summary.daily} chartLabel={summary.chartLabel} />
          <TopMuscles items={summary.topMuscles} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <BestLifts exercises={exercises} />
          <ExerciseProgressionChart exercises={exercises} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <WeightChart points={summary.weights} />
          <WeekGrid
            key={`${summary.days}-${summary.daily[0]?.date ?? "empty"}`}
            data={summary.daily}
          />
        </div>
      </div>
      <NoticeToast notice={notice} onDismissed={dismissNotice} />
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
