"use client";

import { dateHeadingParts } from "@/lib/calculations";
import type { ActivityKind, WeekDayCell } from "@/lib/analytics";

export function WeekStrip({
  days,
  selected,
  onSelect,
}: {
  days: WeekDayCell[];
  selected: string;
  onSelect: (date: string) => void;
}) {
  return (
    <div className="grid grid-cols-7 gap-1" role="group" aria-label="This week">
      {days.map((day) => {
        const heading = dateHeadingParts(day.date);
        const current = day.date === selected;
        return (
          <button
            key={day.date}
            type="button"
            disabled={day.kind === "out"}
            aria-current={current ? "date" : undefined}
            aria-label={dayLabel(heading.weekday, heading.day, day.kind)}
            onClick={() => onSelect(day.date)}
            className={`flex flex-col items-center gap-1 rounded-xl px-1 py-1.5 transition-colors duration-150 disabled:opacity-40 ${
              current ? "bg-chip" : "hover:bg-chip/60"
            }`}
          >
            <span className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
              {heading.weekday}
            </span>
            <WeekDot kind={day.kind} />
          </button>
        );
      })}
    </div>
  );
}

function dayLabel(weekday: string, day: string, kind: ActivityKind): string {
  const activity =
    kind === "both"
      ? "gym and sport"
      : kind === "gym"
        ? "gym"
        : kind === "sport"
          ? "sport"
          : kind === "rest"
            ? "rest"
            : "ahead";
  return `${weekday} ${day}, ${activity}`;
}

function WeekDot({ kind }: { kind: ActivityKind }) {
  if (kind === "out") return <span className="block h-2.5 w-full rounded-full bg-transparent" />;
  if (kind === "rest") return <span className="block h-2.5 w-full rounded-full bg-chip" />;
  if (kind === "sport") {
    return (
      <span
        className="block h-2.5 w-full rounded-full ring-1 ring-brand/40"
        style={{
          backgroundColor: "color-mix(in srgb, var(--accent-primary) 12%, transparent)",
          backgroundImage:
            "repeating-linear-gradient(-45deg, var(--accent-primary) 0 1px, transparent 1px 4px)",
        }}
      />
    );
  }
  if (kind === "both") {
    return (
      <span
        className="block h-2.5 w-full rounded-full bg-brand"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, color-mix(in srgb, var(--accent-fg) 40%, transparent) 0 1px, transparent 1px 4px)",
        }}
      />
    );
  }
  return <span className="block h-2.5 w-full rounded-full bg-brand" />;
}
