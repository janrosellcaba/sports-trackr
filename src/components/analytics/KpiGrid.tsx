"use client";

import { Activity, Dumbbell, Flame, Pill } from "lucide-react";
import type { AnalyticsSummary } from "@/types/trackr";
import { CARD_CLS } from "@/lib/ui";

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

export function KpiGrid({ summary }: { summary: AnalyticsSummary }) {
  const cards = [
    {
      label: "Gym days",
      value: String(summary.totalWorkouts),
      hint: `${summary.gymStreak}d streak`,
      trend: summary.trends.workouts,
      icon: Dumbbell,
    },
    {
      label: "Muscle load",
      value: String(summary.totalGymLoad),
      hint: `${summary.totalHits} hits`,
      trend: summary.trends.gymLoad,
      icon: Flame,
    },
    {
      label: "Sports",
      value: String(summary.totalSports),
      hint: sportHint(summary.totalSportMinutes, summary.totalSportKm),
      trend: summary.trends.sports,
      icon: Activity,
    },
    {
      label: "Supplements",
      value: `${summary.supplementStreak}d`,
      hint: `${summary.supplementDays} days taken`,
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
          <p className="text-2xl font-semibold tabular-nums tracking-tight text-ink">
            {card.value}
          </p>
          <p className="mt-1 text-xs font-semibold text-ink">{card.label}</p>
          <p className="mt-0.5 text-[11px] text-muted">{card.hint}</p>
        </article>
      ))}
    </section>
  );
}

function sportHint(minutes: number, km: number): string {
  const parts: string[] = [];
  if (minutes > 0) parts.push(`${minutes} min`);
  if (km > 0) parts.push(`${km} km`);
  if (parts.length === 0) return "Sessions logged";
  return parts.join(" · ");
}
