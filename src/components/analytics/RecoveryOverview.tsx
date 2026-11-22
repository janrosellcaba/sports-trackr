"use client";

import { restDaysFor, type MuscleRecoveryRow, type RecoveryStatus } from "@/lib/recovery";
import { intensityLabel } from "@/lib/muscles";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";

const GROUPS: { status: RecoveryStatus; title: string; dot: string }[] = [
  { status: "recovering", title: "Recovering", dot: "bg-danger" },
  { status: "ready", title: "Ready", dot: "bg-brand" },
  { status: "neglected", title: "Neglected", dot: "bg-muted" },
];

function detail(row: MuscleRecoveryRow): string {
  if (row.daysAgo == null || row.lastIntensity == null) return "never logged";
  const when = row.daysAgo <= 0 ? "today" : `${row.daysAgo}d ago`;
  const level = intensityLabel(row.lastIntensity);
  const base = `${when} · ${row.lastIntensity}${level ? ` ${level}` : ""}`;
  return row.status === "recovering"
    ? `${base} · ready in ${row.daysLeft}d`
    : base;
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

  return (
    <section className={`${CARD_CLS} p-4`}>
      <div className="mb-4">
        <h2 className={LABEL_CLS}>Recovery</h2>
        <p className="mt-1 text-[11px] text-muted">
          Rest needed after a hit: Light/Steady {restDaysFor(1)}d · Solid {restDaysFor(3)}d ·
          Hard {restDaysFor(4)}d · Wrecked {restDaysFor(5)}d
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {GROUPS.map((group) => {
          const items = rows.filter((row) => row.status === group.status);
          return (
            <div key={group.status}>
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink">
                <span className={`h-2 w-2 rounded-full ${group.dot}`} />
                {group.title}
                <span className="font-mono text-muted">{items.length}</span>
              </p>
              {items.length === 0 ? (
                <p className="text-xs text-muted">—</p>
              ) : (
                <ul className="space-y-1.5">
                  {items.map((row) => (
                    <li key={row.muscleId} className="flex flex-col">
                      <span className="text-sm font-medium text-ink">{row.name}</span>
                      <span className="text-[11px] text-muted">{detail(row)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
