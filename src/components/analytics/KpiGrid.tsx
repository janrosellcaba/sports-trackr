"use client";

import { Activity, Dumbbell, Flame, Pill } from "lucide-react";
import { useUnits } from "@/components/units/UnitsProvider";
import { perWeekRate } from "@/lib/analytics";
import { kmToDisplay, trimNumber } from "@/lib/units";
import type { AnalyticsSummary } from "@/types/trackr";
import { CARD_CLS } from "@/lib/ui";

function TrendBadge({ value }: { value: number | null }) {
  if (value == null) return null;
  const positive = value > 0;
  const neutral = value === 0;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
        neutral
          ? "bg-chip text-muted"
          : positive
            ? "bg-brand-soft text-brand-text"
            : "bg-danger-soft text-danger"
      }`}
    >
      {neutral ? "0%" : `${positive ? "+" : ""}${value}%`}
    </span>
  );
}

export function KpiGrid({ summary }: { summary: AnalyticsSummary }) {
  const { distanceUnit } = useUnits();
  const allTime = summary.days === 0;
  const gymPerWeek = allTime ? null : perWeekRate(summary.totalWorkouts, summary.days);
  const cards = [
    {
      label: "Gym",
      value: String(summary.totalWorkouts),
      hint: gymPerWeek != null
        ? `${summary.gymStreak} streak · ${trimNumber(gymPerWeek)}/wk`
        : `${summary.gymStreak} streak`,
      trend: allTime ? null : summary.trends.workouts,
      icon: Dumbbell,
    },
    {
      label: "Load",
      value: String(summary.totalGymLoad),
      hint: `${summary.totalHits} hits`,
      trend: allTime ? null : summary.trends.gymLoad,
      icon: Flame,
    },
    {
      label: "Sports",
      value: String(summary.totalSports),
      hint: sportHint(summary.totalSportMinutes, summary.totalSportKm, distanceUnit),
      trend: allTime ? null : summary.trends.sports,
      icon: Activity,
    },
    {
      label: "Supps",
      value: String(summary.supplementDays),
      hint: `${summary.supplementStreak} streak`,
      trend: allTime ? null : summary.trends.supplements,
      icon: Pill,
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className={`${CARD_CLS} p-4`}>
          <div className="mb-4 flex items-start justify-between gap-2">
            <card.icon className="h-4 w-4 text-brand-text" />
            {allTime ? (
              <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-bold text-muted">
                All
              </span>
            ) : (
              <TrendBadge value={card.trend} />
            )}
          </div>
          <p className="font-display text-3xl leading-none font-extrabold tabular-nums tracking-tight text-ink">
            {card.value}
          </p>
          <p className="mt-2 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
            {card.label}
          </p>
          <p className="mt-1 text-[11px] text-muted">{card.hint}</p>
        </article>
      ))}
    </section>
  );
}

function sportHint(minutes: number, km: number, unit: "km" | "mi"): string {
  const parts: string[] = [];
  if (minutes > 0) parts.push(`${minutes} min`);
  if (km > 0) parts.push(`${trimNumber(kmToDisplay(km, unit))} ${unit}`);
  return parts.join(" · ") || "—";
}
