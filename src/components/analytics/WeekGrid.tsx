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
      <section className={`${CARD_CLS} border-dashed px-4 py-10 text-center`}>
        <h2 className={`${LABEL_CLS} mb-2`}>Weeks</h2>
        <p className="text-sm text-muted">No days in this range.</p>
      </section>
    );
  }

  return (
    <section className={`${CARD_CLS} p-4`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className={LABEL_CLS}>Weeks</h2>
          <p className="mt-1 text-[11px] text-muted">
            {gymDays} gym · {sportDays} sport
            {sportPerWeek != null ? ` · ${trimNumber(sportPerWeek)} sport/wk` : ""}
          </p>
        </div>
        <p className="flex items-center gap-3 text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2.5 rounded-sm bg-brand shadow-[0_0_10px_var(--accent-glow)]" />
            Gym
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="8" height="12" aria-hidden="true" className="text-brand/85">
              <line
                x1="4"
                y1="1"
                x2="4"
                y2="11"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeDasharray="2.1 2.7"
              />
            </svg>
            Sport
          </span>
        </p>
      </div>

      <div className="mb-2 grid grid-cols-[2.6rem_repeat(7,minmax(0,1fr))] gap-1 px-1.5">
        <span />
        {WEEKDAYS.map((day, index) => (
          <span
            key={`${day}-${index}`}
            className="text-center text-[10px] font-semibold tracking-[0.12em] text-muted uppercase"
          >
            {day}
          </span>
        ))}
      </div>

      <div className="max-h-[22rem] space-y-0.5 overflow-y-auto pr-0.5">
        {weeks.map((week) => {
          const active = week.start === selected?.start;
          return (
            <button
              key={week.start}
              type="button"
              aria-pressed={active}
              aria-label={weekAriaLabel(week)}
              onClick={() => setSelectedStart(week.start)}
              className={`grid w-full grid-cols-[2.6rem_repeat(7,minmax(0,1fr))] items-center gap-1 rounded-xl px-1.5 py-1.5 text-left transition-all duration-150 ${
                active
                  ? "bg-brand/10 ring-1 ring-brand/30"
                  : "hover:bg-chip/50"
              }`}
            >
              <span className="truncate text-[10px] font-semibold tabular-nums text-muted">
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
        <div className="mt-4 grid grid-cols-4 gap-2 text-center" role="status">
          <Readout
            label="Week"
            value={`${formatChartDate(selected.start)}–${formatChartDate(addDaysISO(selected.start, 6))}`}
          />
          <Readout label="Gym" value={String(selectedCounts.gym)} />
          <Readout label="Sport" value={String(selectedCounts.sport)} />
          <Readout label="Rest" value={String(selectedCounts.rest)} />
        </div>
      ) : null}
    </section>
  );
}

function KindCell({ kind }: { kind: ActivityKind }) {
  if (kind === "out") return <span className="block h-7" />;
  if (kind === "rest") {
    return <span className="block h-7 rounded-md bg-chip/85" />;
  }
  if (kind === "gym") {
    return (
      <span className="block h-7 rounded-md bg-brand shadow-[0_0_14px_var(--accent-glow)]" />
    );
  }
  if (kind === "sport") {
    return (
      <span className="relative block h-7 overflow-hidden rounded-md bg-chip/55 ring-1 ring-line/70">
        <Stitch />
      </span>
    );
  }
  return (
    <span className="relative block h-7 overflow-hidden rounded-md bg-brand shadow-[0_0_14px_var(--accent-glow)]">
      <Stitch onBrand />
    </span>
  );
}

function Stitch({ onBrand = false }: { onBrand?: boolean }) {
  const color = onBrand ? "var(--accent-fg)" : "var(--accent-primary)";
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-[5px] left-1/2 w-[2px] -translate-x-1/2"
      style={{
        backgroundImage: `repeating-linear-gradient(to bottom, ${color} 0 2px, transparent 2px 5.5px)`,
      }}
    />
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-chip/70 px-1.5 py-2">
      <p className="truncate font-display text-sm font-bold tabular-nums text-ink">
        {value}
      </p>
      <p className="mt-0.5 text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">
        {label}
      </p>
    </div>
  );
}

function weekAriaLabel(week: ActivityWeek): string {
  const counts = weekCounts(week);
  return `Week of ${formatChartDate(week.start)}, ${counts.gym} gym, ${counts.sport} sport, ${counts.rest} rest`;
}
