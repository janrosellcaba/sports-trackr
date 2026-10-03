"use client";

import { useUnits } from "@/components/units/UnitsProvider";
import { formatLift } from "@/lib/catalog";
import { formatDisplayDate } from "@/lib/calculations";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";
import type { NotebookExercise } from "@/types/trackr";

export function BestLifts({
  exercises,
  className = "",
}: {
  exercises: NotebookExercise[];
  className?: string;
}) {
  const { massUnit } = useUnits();
  const records = [...exercises]
    .filter((item) => item.prWeight != null)
    .sort((a, b) => {
      const dateCmp = (b.prDate ?? "").localeCompare(a.prDate ?? "");
      return dateCmp !== 0 ? dateCmp : a.name.localeCompare(b.name);
    });

  if (records.length === 0) {
    return (
      <section className={`${CARD_CLS} border-dashed px-4 py-10 text-center ${className}`}>
        <h2 className={`${LABEL_CLS} mb-2`}>PRs</h2>
        <p className="text-sm text-muted">None yet.</p>
      </section>
    );
  }

  return (
    <section className={`${CARD_CLS} flex min-h-0 flex-col p-4 ${className}`}>
      <h2 className={`${LABEL_CLS} mb-3`}>PRs</h2>
      <ul className="min-h-0 max-h-64 divide-y divide-line overflow-y-auto overscroll-contain lg:max-h-72">
        {records.map((item) => (
          <li
            key={item.id}
            className="flex items-baseline justify-between gap-3 py-2"
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
