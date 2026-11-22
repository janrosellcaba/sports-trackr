"use client";

import { restDaysFor, type MuscleRecoveryRow, type RecoveryStatus } from "@/lib/recovery";
import { intensityLabel } from "@/lib/muscles";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";

const STATUS: Record<
  RecoveryStatus,
  { title: string; text: string; bar: string; pill: string }
> = {
  recovering: {
    title: "Recovering",
    text: "text-danger",
    bar: "bg-danger",
    pill: "bg-danger-soft text-danger",
  },
  ready: {
    title: "Ready",
    text: "text-brand-text",
    bar: "bg-brand",
    pill: "bg-brand-soft text-brand-text",
  },
  neglected: {
    title: "Neglected",
    text: "text-muted",
    bar: "bg-muted/60",
    pill: "bg-chip text-muted",
  },
};

/** 0-100: how much of the needed rest has passed. */
function progress(row: MuscleRecoveryRow): number {
  if (row.status !== "recovering" || row.daysAgo == null || row.lastIntensity == null) {
    return 100;
  }
  return Math.max(6, Math.round((row.daysAgo / restDaysFor(row.lastIntensity)) * 100));
}

function detail(row: MuscleRecoveryRow): string {
  if (row.daysAgo == null || row.lastIntensity == null) return "Never logged";
  const when = row.daysAgo <= 0 ? "Today" : `${row.daysAgo}d ago`;
  const level = intensityLabel(row.lastIntensity);
  return `${when}${level ? ` · ${level}` : ""}`;
}

export function RecoveryOverview({ rows }: { rows: MuscleRecoveryRow[] }) {
  if (rows.length === 0 || rows.every((row) => row.daysAgo == null)) {
    return (
      <section className={`${CARD_CLS} border-dashed px-4 py-8 text-center`}>
        <h2 className={`${LABEL_CLS} mb-2`}>Recovery</h2>
        <p className="text-sm text-muted">Log gym sessions to track recovery.</p>
      </section>
    );
  }

  const counts = (Object.keys(STATUS) as RecoveryStatus[]).map((status) => ({
    status,
    count: rows.filter((row) => row.status === status).length,
  }));

  return (
    <section className={`${CARD_CLS} p-4`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className={LABEL_CLS}>Recovery</h2>
        <div className="flex flex-wrap gap-1.5">
          {counts
            .filter((item) => item.count > 0)
            .map((item) => (
              <span
                key={item.status}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold tabular-nums ${STATUS[item.status].pill}`}
              >
                {item.count} {STATUS[item.status].title.toLowerCase()}
              </span>
            ))}
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {rows.map((row) => {
          const style = STATUS[row.status];
          return (
            <li
              key={row.muscleId}
              className="rounded-xl border border-line bg-chip/40 p-3"
            >
              <p className="truncate text-sm font-semibold text-ink">{row.name}</p>
              <div className="my-2 h-1 overflow-hidden rounded-full bg-chip">
                <div
                  className={`h-full rounded-full ${style.bar}`}
                  style={{ width: `${progress(row)}%` }}
                />
              </div>
              <p className="flex items-center justify-between gap-2 text-[11px]">
                <span className="truncate text-muted">{detail(row)}</span>
                <span className={`shrink-0 font-semibold ${style.text}`}>
                  {row.status === "recovering" ? `${row.daysLeft}d left` : style.title}
                </span>
              </p>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-[11px] text-muted">
        Rest needed after a hit: Light/Steady {restDaysFor(1)}d · Solid {restDaysFor(3)}d ·
        Hard {restDaysFor(4)}d · Wrecked {restDaysFor(5)}d
      </p>
    </section>
  );
}
