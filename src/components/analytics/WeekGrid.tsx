"use client";

import { useMemo, useState } from "react";
import {
  addDaysISO,
  formatChartDate,
} from "@/lib/calculations";
import {
  buildActivityWeeks,
  perWeekRate,
  weekCounts,
  type ActivityKind,
  type ActivityWeek,
} from "@/lib/analytics";
import { trimNumber } from "@/lib/units";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";
import type { DailyActivityPoint } from "@/types/trackr";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"] as const;

export function WeekGrid({ data }: { data: DailyActivityPoint[] }) {
  const weeks = useMemo(() => buildActivityWeeks(data), [data]);
  const defaultStart =
    [...weeks]
      .reverse()
      .find((week) => week.days.some((day) => day.kind !== "out" && day.kind !== "rest"))
      ?.start ?? weeks[weeks.length - 1]?.start ?? null;
  const [selectedStart, setSelectedStart] = useState<string | null>(defaultStart);
  const selected =
    weeks.find((week) => week.start === selectedStart) ?? weeks[weeks.length - 1] ?? null;
  const selectedCounts = selected ? weekCounts(selected) : null;
  const gymDays = data.filter((point) => point.workouts > 0).length;
  const sportDays = data.filter((point) => point.sports > 0).length;
  const sportPerWeek = perWeekRate(sportDays, data.length);

  if (weeks.length === 0) {
    return (
      <section className={`${CARD_CLS} border-dashed px-4 py-8 text-center`}>
        <h2 className={`${LABEL_CLS} mb-2`}>Weeks</h2>
        <p className="text-sm text-muted">No days in this range.</p>
      </section>
    );
  }

  return (
    <section className={`${CARD_CLS} p-3.5`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className={LABEL_CLS}>Weeks</h2>
          <p className="mt-1 text-[11px] text-muted">
            {gymDays} gym · {sportDays} sport
            {sportPerWeek != null ? ` · ${trimNumber(sportPerWeek)} sport/wk` : ""}
          </p>
        </div>
        <p className="flex items-center gap-3 text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-2 rounded-[2px] bg-brand" />
            Gym
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-2.5 rounded-[2px] ring-1 ring-brand/40"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(-45deg, var(--accent-primary) 0 1px, transparent 1px 5px)",
              }}
            />
            Sport
          </span>
        </p>
      </div>

      <div className="mb-1 grid grid-cols-[2.4rem_repeat(7,minmax(0,1fr))] gap-1 px-1">
        <span />
        {WEEKDAYS.map((day, index) => (
          <span
            key={`${day}-${index}`}
            className="text-center text-[9px] font-semibold tracking-[0.14em] text-muted uppercase"
          >
            {day}
          </span>
        ))}
      </div>

      <div className="space-y-px">
        {weeks.map((week) => {
          const active = week.start === selected?.start;
          return (
            <button
              key={week.start}
              type="button"
              aria-pressed={active}
              aria-label={weekAriaLabel(week)}
              onClick={() => setSelectedStart(week.start)}
              className={`grid w-full grid-cols-[2.4rem_repeat(7,minmax(0,1fr))] items-center gap-1 rounded-lg px-1 py-1 text-left transition-colors duration-150 ${
                active
                  ? "bg-brand/10 ring-1 ring-brand/25"
                  : "hover:bg-chip/70"
              }`}
            >
              <span className="truncate text-[9px] font-semibold tabular-nums text-muted">
                {formatChartDate(week.start)}
              </span>
              {week.days.map((day) => (
                <KindCell key={day.date} kind={day.kind} />
              ))}
            </button>
          );
        })}
      </div>

      {selected && selectedCounts ? (
        <p
          className="mt-3 text-center text-[11px] text-muted"
          role="status"
        >
          <span className="font-semibold text-ink">
            {formatChartDate(selected.start)}–{formatChartDate(addDaysISO(selected.start, 6))}
          </span>
          {` · ${selectedCounts.gym} gym · ${selectedCounts.sport} sport · ${selectedCounts.rest} rest`}
        </p>
      ) : null}
    </section>
  );
}

function KindCell({ kind }: { kind: ActivityKind }) {
  if (kind === "out") return <span className="block h-4" />;
  if (kind === "rest") {
    return <span className="block h-4 rounded-[4px] bg-chip/70" />;
  }
  if (kind === "gym") {
    return (
      <span className="block h-4 rounded-[4px] bg-brand shadow-[0_0_10px_var(--accent-glow)]" />
    );
  }
  if (kind === "sport") {
    return (
      <span
        className="block h-4 rounded-[4px] ring-1 ring-brand/35"
        style={{
          backgroundColor: "color-mix(in srgb, var(--accent-primary) 10%, transparent)",
          backgroundImage:
            "repeating-linear-gradient(-45deg, var(--accent-primary) 0 1px, transparent 1px 6px)",
        }}
      />
    );
  }
  return (
    <span
      className="block h-4 rounded-[4px] bg-brand shadow-[0_0_10px_var(--accent-glow)]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(-45deg, color-mix(in srgb, var(--accent-fg) 38%, transparent) 0 1px, transparent 1px 7px)",
      }}
    />
  );
}

function weekAriaLabel(week: ActivityWeek): string {
  const counts = weekCounts(week);
  return `Week of ${formatChartDate(week.start)}, ${counts.gym} gym, ${counts.sport} sport, ${counts.rest} rest`;
}
