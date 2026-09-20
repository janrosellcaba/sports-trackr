"use client";

import { useUnits } from "@/components/units/UnitsProvider";
import { formatLift } from "@/lib/catalog";
import { formatDisplayDate } from "@/lib/calculations";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";
import type { NotebookExercise } from "@/types/trackr";

export function BestLifts({ exercises }: { exercises: NotebookExercise[] }) {
  const { massUnit } = useUnits();
  const records = [...exercises]
    .filter((item) => item.prWeight != null)
    .sort((a, b) => {
      const dateCmp = (b.prDate ?? "").localeCompare(a.prDate ?? "");
      return dateCmp !== 0 ? dateCmp : a.name.localeCompare(b.name);
    });

  if (records.length === 0) {
    return (
      <section className={`${CARD_CLS} border-dashed px-4 py-10 text-center`}>
        <h2 className={`${LABEL_CLS} mb-2`}>PRs</h2>
        <p className="text-sm text-muted">None yet.</p>
      </section>
    );
  }

  return (
    <section className={`${CARD_CLS} p-4`}>
      <h2 className={`${LABEL_CLS} mb-4`}>PRs</h2>
      <ul className="space-y-1">
        {records.map((item) => (
          <li
            key={item.id}
            className="flex items-baseline justify-between gap-3 rounded-xl px-1 py-2"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink">
                {item.name}
              </span>
              {item.prDate ? (
                <span className="text-xs text-muted">{formatDisplayDate(item.prDate)}</span>
              ) : null}
            </span>
            <span className="shrink-0 font-display text-sm font-bold tabular-nums text-ink">
              {formatLift(item.prWeight, item.prReps, massUnit, item.dualWeights)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
