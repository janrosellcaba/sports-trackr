"use client";

import { CalendarDays, Flame } from "lucide-react";
import { compareCounts, perWeekRate } from "@/lib/analytics";
import { trimNumber } from "@/lib/units";
import type { AnalyticsSummary } from "@/types/trackr";
import { CARD_CLS } from "@/lib/ui";

export function KpiGrid({ summary }: { summary: AnalyticsSummary }) {
  const allTime = summary.days === 0;
  const activityPerWeek = allTime
    ? null
    : perWeekRate(summary.activityDays, summary.days);
  const cards = [
    {
      label: "Activity",
      value: String(summary.activityDays),
      hint: activityHint(summary, activityPerWeek),
      compare: allTime
        ? null
        : compareCounts(
            summary.activityDays,
            summary.previous?.activityDays ?? 0,
          ),
      compareUp:
        summary.previous != null &&
        summary.activityDays > summary.previous.activityDays,
      compareDown:
        summary.previous != null &&
        summary.activityDays < summary.previous.activityDays,
      icon: CalendarDays,
    },
    {
      label: "Load",
      value: String(summary.totalGymLoad),
      hint: `${summary.totalHits} hits`,
      compare: allTime
        ? null
        : compareCounts(summary.totalGymLoad, summary.previous?.gymLoad ?? 0),
      compareUp:
        summary.previous != null &&
        summary.totalGymLoad > summary.previous.gymLoad,
      compareDown:
        summary.previous != null &&
        summary.totalGymLoad < summary.previous.gymLoad,
      icon: Flame,
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <article key={card.label} className={`${CARD_CLS} p-4`}>
          <div className="mb-4 flex items-start justify-between gap-2">
            <card.icon className="h-4 w-4 text-brand-text" />
            {allTime ? (
              <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-bold text-muted">
                All
              </span>
            ) : (
              <CompareBadge
                label={card.compare}
                up={card.compareUp}
                down={card.compareDown}
              />
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

function CompareBadge({
  label,
  up,
  down,
}: {
  label: string | null;
  up: boolean;
  down: boolean;
}) {
  if (!label) return null;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
        down
          ? "bg-danger-soft text-danger"
          : up
            ? "bg-brand-soft text-brand-text"
            : "bg-chip text-muted"
      }`}
    >
      {label}
    </span>
  );
}

function activityHint(
  summary: AnalyticsSummary,
  perWeek: number | null,
): string {
  if (summary.days === 0) {
    return `${summary.gymDays} gym · ${summary.sportDays} sport`;
  }
  const parts = [`${summary.activityDays} on`, `${summary.restDays} off`];
  if (summary.days > 7 && perWeek != null) {
    parts.push(`${trimNumber(perWeek)}/wk`);
  }
  return parts.join(" · ");
}
