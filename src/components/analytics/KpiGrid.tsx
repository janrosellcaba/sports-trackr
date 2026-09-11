"use client";

import { Activity, Dumbbell, Flame, Pill } from "lucide-react";
import type { AnalyticsSummary } from "@/types/trackr";

type KpiGridProps = {
  summary: AnalyticsSummary;
};

function TrendBadge({ value }: { value: number }) {
  const positive = value > 0;
  const neutral = value === 0;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
        neutral
          ? "bg-neutral-800 text-neutral-400"
          : positive
            ? "bg-emerald-500/15 text-emerald-400"
            : "bg-red-500/15 text-red-400"
      }`}
    >
      {neutral ? "0%" : `${positive ? "+" : ""}${value}%`}
    </span>
  );
}

export function KpiGrid({ summary }: KpiGridProps) {
  const cards = [
    {
      label: "Total Sessions",
      value: String(summary.totalSessions),
      hint: `Last ${summary.days}d`,
      trend: summary.trends.sessions,
      icon: Dumbbell,
    },
    {
      label: "Sports Active Time",
      value: formatMinutes(summary.totalCardioMinutes),
      hint: "Cardio / racquet",
      trend: summary.trends.cardioMinutes,
      icon: Activity,
    },
    {
      label: "Total Volume Lifted",
      value: formatVolume(summary.totalVolumeKg),
      hint: "Weight × reps",
      trend: summary.trends.volumeKg,
      icon: Flame,
    },
    {
      label: "Supplement Streak",
      value: `${summary.supplementStreak}d`,
      hint: `${summary.supplementComplianceDays} days logged`,
      trend: summary.trends.supplements,
      icon: Pill,
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-2xl border border-neutral-850 bg-neutral-950/80 p-3.5"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <card.icon className="h-4 w-4 text-lime-400/80" />
            <TrendBadge value={card.trend} />
          </div>
          <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-neutral-50">
            {card.value}
          </p>
          <p className="mt-1 text-xs font-medium text-neutral-300">
            {card.label}
          </p>
          <p className="mt-0.5 text-[11px] text-neutral-500">{card.hint}</p>
        </article>
      ))}
    </section>
  );
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0 ? `${hours}h` : `${hours}h ${rem}m`;
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${kg.toLocaleString()}kg`;
}
