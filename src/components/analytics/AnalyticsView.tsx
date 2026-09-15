"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getAnalyticsSummary,
  getExerciseNames,
} from "@/app/actions/analytics";
import { ActivityChart } from "@/components/analytics/ActivityChart";
import { ExerciseProgressionChart } from "@/components/analytics/ExerciseProgressionChart";
import { KpiGrid } from "@/components/analytics/KpiGrid";
import { TopExercises } from "@/components/analytics/TopExercises";
import { PAGE_TITLE } from "@/lib/ui";
import type { AnalyticsPeriod, AnalyticsSummary } from "@/types/trackr";

const PERIODS: { key: AnalyticsPeriod; label: string }[] = [
  { key: 7, label: "7d" },
  { key: 30, label: "30d" },
  { key: 90, label: "90d" },
  { key: 0, label: "All" },
];

export function AnalyticsView({
  initialSummary,
  initialNames,
}: {
  initialSummary: AnalyticsSummary;
  initialNames: string[];
}) {
  const [period, setPeriod] = useState<AnalyticsPeriod>(30);
  const [summary, setSummary] = useState(initialSummary);
  const [names, setNames] = useState(initialNames);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const [nextSummary, nextNames] = await Promise.all([
        getAnalyticsSummary(period),
        getExerciseNames(),
      ]);
      setSummary(nextSummary);
      setNames(nextNames);
    });
  }, [period]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={PAGE_TITLE}>Analytics</h1>
          <p className="mt-1 text-sm text-muted">{summary.periodLabel}</p>
        </div>
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-chip/80 p-1">
          {PERIODS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setPeriod(item.key)}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition-all duration-150 ${
                period === item.key
                  ? "bg-paper text-ink shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className={isPending ? "opacity-70" : ""}>
        <div className="space-y-5">
          <KpiGrid summary={summary} />
          <ActivityChart data={summary.daily} />
          <TopExercises items={summary.topExercises} />
          <ExerciseProgressionChart exerciseNames={names} />
        </div>
      </div>
    </div>
  );
}
