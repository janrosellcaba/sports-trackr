"use client";

import { Activity, Dumbbell, Flame, Pill, Weight } from "lucide-react";
import { useUnits } from "@/components/units/UnitsProvider";
import { kgToDisplay, kmToDisplay, trimNumber } from "@/lib/units";
import type { AnalyticsSummary } from "@/types/trackr";
import { CARD_CLS } from "@/lib/ui";
function TrendBadge({ value }: { value: number | null }) {
  if (value == null) {
    return (
      <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-bold text-muted">
        New
      </span>
    );
  }
  const positive = value > 0;
  const neutral = value === 0;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
        neutral
          ? "bg-chip text-muted"
          : positive
            ? "bg-brand-soft text-brand-text"
            : "bg-danger-soft text-danger"
      }`}
    >
      {neutral ? "0%" : `${positive ? "+" : ""}${value}% vs prior`}
    </span>
  );
}

export function KpiGrid({ summary }: { summary: AnalyticsSummary }) {
  const { massUnit, distanceUnit } = useUnits();
  const allTime = summary.days === 0;
  const cards = [
    {
      label: "Gym days",
      value: String(summary.totalWorkouts),
      hint: `${summary.gymStreak}-day streak`,
      trend: allTime ? null : summary.trends.workouts,
      icon: Dumbbell,
    },
    {
      label: `Total ${massUnit}`,
      value: trimNumber(kgToDisplay(summary.totalLiftedKg, massUnit)),
      hint: "Working sets · two-weight lifts count both",
      trend: allTime ? null : summary.trends.liftedKg,
      icon: Weight,
    },
    {
      label: "Muscle load",
      value: String(summary.totalGymLoad),
      hint: `${summary.totalHits} hits · intensity 1–5 each`,
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
      label: "Supplement days",
      value: String(summary.supplementDays),
      hint: `${summary.supplementStreak}-day streak`,
      trend: allTime ? null : summary.trends.supplements,
      icon: Pill,
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {cards.map((card) => (
        <article key={card.label} className={`${CARD_CLS} p-3.5`}>
          <div className="mb-3 flex items-start justify-between gap-2">
            <card.icon className="h-4 w-4 text-brand-text" />
            {allTime ? (
              <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-bold text-muted">
                All time
              </span>
            ) : (
              <TrendBadge value={card.trend} />
            )}
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

function sportHint(minutes: number, km: number, unit: "km" | "mi"): string {
  const parts: string[] = [];
  if (minutes > 0) parts.push(`${minutes} min`);
  if (km > 0) parts.push(`${trimNumber(kmToDisplay(km, unit))} ${unit}`);
  if (parts.length === 0) return "Sessions logged";
  return parts.join(" · ");
}
