"use client";

import { CalendarDays, Flame } from "lucide-react";
import { perWeekRate, percentChange } from "@/lib/analytics";
import { trimNumber } from "@/lib/units";
import type { AnalyticsSummary } from "@/types/trackr";
import { CARD_CLS } from "@/lib/ui";

/** A load jump above this versus the previous period is flagged as a spike. */
export const LOAD_SPIKE_PERCENT = 30;

type Badge = { label: string; tone: "up" | "down" | "warn" | "flat" } | null;

function signed(value: number): string {
  return value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : "0";
}

export function KpiGrid({ summary }: { summary: AnalyticsSummary }) {
  const allTime = summary.days === 0;
  const prev = summary.previous;

  const activePerWeek = allTime ? null : perWeekRate(summary.activityDays, summary.days);
  const weeklyLoad = allTime
    ? summary.totalGymLoad
    : Math.round((summary.totalGymLoad / summary.days) * 7);

  let activityBadge: Badge = null;
  if (!allTime && prev) {
    const diff = summary.activityDays - prev.activityDays;
    activityBadge = {
      label: `${signed(diff)} vs prev`,
      tone: diff > 0 ? "up" : diff < 0 ? "down" : "flat",
    };
  }

  let loadBadge: Badge = null;
  if (!allTime && prev) {
    const change = percentChange(summary.totalGymLoad, prev.gymLoad);
    if (change != null) {
      loadBadge =
        change >= LOAD_SPIKE_PERCENT
          ? { label: `Spike +${change}%`, tone: "warn" }
          : { label: `${signed(change)}%`, tone: change < 0 ? "down" : change > 0 ? "up" : "flat" };
    }
  }

  const cards = [
    {
      label: "Active days",
      value: String(summary.activityDays),
      hint: allTime
        ? `${summary.gymDays} gym · ${summary.sportDays} sport`
        : `of ${summary.days} days${
            summary.days > 7 && activePerWeek != null ? ` · ${trimNumber(activePerWeek)}/week` : ""
          }`,
      badge: activityBadge,
      icon: CalendarDays,
    },
    {
      label: allTime ? "Total load" : "Load per week",
      value: String(weeklyLoad),
      hint: allTime ? "Sum of muscle intensities" : `${summary.totalGymLoad} in total`,
      badge: loadBadge,
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
              <BadgePill badge={card.badge} />
            )}
          </div>
          <p className="font-display text-3xl leading-none font-bold tabular-nums tracking-tight text-ink">
            {card.value}
          </p>
          <p className="mt-2 text-[11px] font-semibold tracking-[0.18em] text-muted uppercase">
            {card.label}
          </p>
          <p className="mt-1 text-[11px] text-muted">{card.hint}</p>
        </article>
      ))}
    </section>
  );
}

const TONE: Record<NonNullable<Badge>["tone"], string> = {
  up: "bg-brand-soft text-brand-text",
  down: "bg-chip text-muted",
  warn: "bg-danger-soft text-danger",
  flat: "bg-chip text-muted",
};

function BadgePill({ badge }: { badge: Badge }) {
  if (!badge) return null;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${TONE[badge.tone]}`}
    >
      {badge.label}
    </span>
  );
}
