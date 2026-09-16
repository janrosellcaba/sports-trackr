"use client";

import type { TopMuscle } from "@/types/trackr";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";

export function TopMuscles({ items }: { items: TopMuscle[] }) {
  if (items.length === 0) return null;

  const max = items[0]?.load || 1;

  return (
    <section className={`${CARD_CLS} p-4`}>
      <h2 className={`${LABEL_CLS} mb-4`}>Most trained</h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.name}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
              <p className="shrink-0 font-mono text-xs tabular-nums text-muted">
                {item.avgIntensity} avg
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-chip">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.max(8, (item.load / max) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted">
              {item.hits} hits · {item.days} days
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
