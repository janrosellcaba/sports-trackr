"use client";

import { Activity, Dumbbell, Flame, Pill } from "lucide-react";
import type { AnalyticsSummary } from "@/types/trackr";
import { CARD_CLS } from "@/lib/ui";

type KpiGridProps = {
  summary: AnalyticsSummary;
};

function TrendBadge({ value }: { value: number }) {
  const positive = value > 0;
  const neutral = value === 0;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
        neutral
          ? "bg-chip text-muted"
          : positive
            ? "bg-brand-soft text-brand"
            : "bg-danger-soft text-danger"
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
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className={`${CARD_CLS} p-3.5`}>
          <div className="mb-3 flex items-start justify-between gap-2">
            <card.icon className="h-4 w-4 text-brand" />
            <TrendBadge value={card.trend} />
          </div>
          <p className="text-2xl font-extrabold tracking-tight text-ink tabular-nums">
            {card.value}
          </p>
          <p className="mt-1 text-xs font-semibold text-ink">{card.label}</p>
          <p className="mt-0.5 text-[11px] text-muted">{card.hint}</p>
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
