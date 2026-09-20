"use client";

import type { TopMuscle } from "@/types/trackr";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";

export function TopMuscles({ items }: { items: TopMuscle[] }) {
  if (items.length === 0) {
    return (
      <section className={`${CARD_CLS} border-dashed px-4 py-10 text-center`}>
        <h2 className={`${LABEL_CLS} mb-2`}>Muscles</h2>
        <p className="text-sm text-muted">No hits yet.</p>
      </section>
    );
  }

  const max = items[0]?.load || 1;

  return (
    <section className={`${CARD_CLS} p-4`}>
      <h2 className={`${LABEL_CLS} mb-4`}>Muscles</h2>
      <ul className="space-y-3.5">
        {items.map((item, index) => (
          <li key={item.name} className="flex items-center gap-3">
            <span className="w-5 shrink-0 font-display text-sm font-bold tabular-nums text-muted">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                <p className="shrink-0 font-mono text-xs tabular-nums text-muted">
                  {item.avgIntensity}
                </p>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-chip">
                <div
                  className="h-full rounded-full bg-brand shadow-[0_0_12px_var(--accent-glow)]"
                  style={{ width: `${Math.max(2, (item.load / max) * 100)}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
