"use client";

import { useMemo } from "react";
import { parseISODate } from "@/lib/calculations";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";
import type { DailyActivityPoint } from "@/types/trackr";

const LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Share of each weekday (Mon-first) that had gym or sport in the period. */
export function weekdayPattern(data: DailyActivityPoint[]) {
  const totals = LABELS.map(() => ({ days: 0, active: 0 }));
  for (const point of data) {
    const index = (parseISODate(point.date).getDay() + 6) % 7;
    totals[index].days += 1;
    if (point.workouts > 0 || point.sports > 0) totals[index].active += 1;
  }
  return totals.map((item, index) => ({
    label: LABELS[index],
    active: item.active,
    days: item.days,
    rate: item.days > 0 ? item.active / item.days : 0,
  }));
}

export function WeekdayPattern({ data }: { data: DailyActivityPoint[] }) {
  const rows = useMemo(() => weekdayPattern(data), [data]);
  const best = rows.reduce((a, b) => (b.rate > a.rate ? b : a), rows[0]);
  const hasData = rows.some((row) => row.active > 0);

  return (
    <section className={`${CARD_CLS} p-4`}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className={LABEL_CLS}>Weekday pattern</h2>
        {hasData ? (
          <p className="text-[11px] text-muted">Most active: {best.label}</p>
        ) : null}
      </div>
      {hasData ? (
        <ul className="flex h-32 items-end gap-2">
          {rows.map((row) => (
            <li
              key={row.label}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
              title={`${row.label}: ${row.active} of ${row.days} days`}
            >
              <span className="text-[10px] font-semibold tabular-nums text-muted">
                {Math.round(row.rate * 100)}%
              </span>
              <div className="flex w-full flex-1 items-end rounded-md bg-chip">
                <div
                  className="w-full rounded-md bg-brand"
                  style={{ height: `${Math.max(row.rate * 100, row.active > 0 ? 6 : 0)}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold tracking-wide text-muted uppercase">
                {row.label}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-center text-sm text-muted">No activity in this range.</p>
      )}
    </section>
  );
}
