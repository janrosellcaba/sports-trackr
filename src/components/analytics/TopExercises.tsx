"use client";

import type { TopExercise } from "@/types/trackr";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";

export function TopExercises({ items }: { items: TopExercise[] }) {
  if (items.length === 0) return null;

  const max = items[0]?.volumeKg || 1;

  return (
    <section className={`${CARD_CLS} p-4`}>
      <h2 className={LABEL_CLS}>Top lifts</h2>
      <p className="mt-1 mb-4 text-base font-bold text-ink">By volume</p>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.name}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
              <p className="shrink-0 font-mono text-xs tabular-nums text-muted">
                {item.volumeKg.toLocaleString()}kg
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-chip">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.max(8, (item.volumeKg / max) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted">
              {item.sets} sets · {item.workouts} days
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
