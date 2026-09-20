"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Check, Copy } from "lucide-react";
import { BestLifts } from "@/components/analytics/BestLifts";
import { KpiGrid } from "@/components/analytics/KpiGrid";
import { TopMuscles } from "@/components/analytics/TopMuscles";
import { WeekGrid } from "@/components/analytics/WeekGrid";
import { useUnits } from "@/components/units/UnitsProvider";
import { formatLift } from "@/lib/catalog";
import { kmToDisplay, trimNumber, type DistanceUnit, type MassUnit } from "@/lib/units";
import { perWeekRate } from "@/lib/analytics";
import { GHOST_BTN, PAGE_TITLE, SEGMENT_TRACK, segmentItemClass } from "@/lib/ui";
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
      <div className="flex items-start justify-between gap-3">
        <h1 className={PAGE_TITLE}>Analytics</h1>
        <CopyTrainerJson summary={summary} exercises={exercises} />
      </div>
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

      <div className="space-y-5">
        <KpiGrid summary={summary} />
        <WeekGrid
          key={`${summary.days}-${summary.daily[0]?.date ?? "empty"}`}
          data={summary.daily}
        />
        <div className="grid gap-5 lg:grid-cols-2">
          <ActivityChart data={summary.daily} chartLabel={summary.chartLabel} />
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

function CopyTrainerJson({
  summary,
  exercises,
}: {
  summary: AnalyticsSummary;
  exercises: NotebookExercise[];
}) {
  const { massUnit, distanceUnit } = useUnits();
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => {
    return () => window.clearTimeout(timer.current);
  }, []);

  return (
    <button
      type="button"
      className={GHOST_BTN}
      aria-label={copied ? "Copied" : "Copy JSON"}
      title={copied ? "Copied" : "Copy JSON"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(
            JSON.stringify(
              trainerPayload(summary, exercises, massUnit, distanceUnit),
              null,
              2,
            ),
          );
          setCopied(true);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? (
        <Check className="h-4 w-4 text-brand-text" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}

function trainerPayload(
  summary: AnalyticsSummary,
  exercises: NotebookExercise[],
  massUnit: MassUnit,
  distanceUnit: DistanceUnit,
) {
  return {
    period: summary.periodLabel,
    units: { mass: massUnit, distance: distanceUnit },
    legend: {
      gymLoad: "Sum of muscle intensities (1–5) that day",
      intensity: "1 Light → 5 Wrecked",
      activityDay: "A day with gym, sport, or both",
      sportDay: "A day with at least one sport session",
    },
    activity: {
      days: summary.activityDays,
      restDays: summary.days ? summary.restDays : null,
      perWeek: summary.days ? perWeekRate(summary.activityDays, summary.days) : null,
      gymDays: summary.gymDays,
      sportDays: summary.sportDays,
      previousDays: summary.previous?.activityDays ?? null,
    },
    gym: {
      days: summary.gymDays,
      load: summary.totalGymLoad,
      hits: summary.totalHits,
      streak: summary.gymStreak,
      previousLoad: summary.previous?.gymLoad ?? null,
    },
    sports: {
      days: summary.sportDays,
      sessions: summary.totalSports,
      perWeek: summary.days ? perWeekRate(summary.sportDays, summary.days) : null,
      minutes: summary.totalSportMinutes,
      distance: summary.totalSportKm
        ? trimNumber(kmToDisplay(summary.totalSportKm, distanceUnit))
        : 0,
    },
    supplements: {
      days: summary.supplementDays,
      streak: summary.supplementStreak,
    },
    topMuscles: summary.topMuscles,
    personalRecords: exercises
      .filter((item) => item.prWeight != null)
      .map((item) => ({
        name: item.name,
        lift: formatLift(item.prWeight, item.prReps, massUnit, item.dualWeights),
        date: item.prDate,
      })),
    daily: summary.daily,
  };
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
