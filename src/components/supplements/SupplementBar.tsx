"use client";

import { useMemo, useTransition } from "react";
import { deleteSupplement, logSupplement } from "@/app/actions/supplements";
import { mergeSupplementCatalog } from "@/lib/catalog";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";
import type {
  CustomSupplementPayload,
  SupplementPayload,
} from "@/types/trackr";

export function SupplementBar({
  date,
  intakes,
  customSupplements,
  onChange,
}: {
  date: string;
  intakes: SupplementPayload[];
  customSupplements: CustomSupplementPayload[];
  onChange: (intakes: SupplementPayload[]) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const catalog = useMemo(
    () => mergeSupplementCatalog(customSupplements),
    [customSupplements],
  );

  function handleQuickLog(item: (typeof catalog)[number]) {
    startTransition(async () => {
      const logged = await logSupplement({
        name: item.name,
        dose: item.defaultDose,
        date,
      });
      onChange([logged, ...intakes]);
    });
  }

  function handleUndo(id: string) {
    startTransition(async () => {
      await deleteSupplement(id);
      onChange(intakes.filter((item) => item.id !== id));
    });
  }

  return (
    <section className={`${CARD_CLS} space-y-3 p-4`}>
      <div>
        <p className={LABEL_CLS}>Supplements</p>
        <h2 className="text-base font-bold text-ink">Tap to log</h2>
      </div>

      {catalog.length === 0 ? (
        <p className="text-sm text-muted">
          Add supplements in Settings, then tap to log them here.
        </p>
      ) : (
        <div
          className={`grid grid-cols-1 gap-2 ${
            catalog.length > 3 ? "sm:grid-cols-2" : "sm:grid-cols-3"
          }`}
        >
          {catalog.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={isPending}
              onClick={() => handleQuickLog(item)}
              className="flex h-12 items-center justify-center rounded-xl bg-chip text-sm font-bold text-ink transition-all duration-150 hover:bg-chip-hover active:scale-[0.98] disabled:opacity-60"
            >
              + {item.name}
            </button>
          ))}
        </div>
      )}

      {intakes.length > 0 ? (
        <ul className="space-y-1.5 border-t border-line pt-3">
          {intakes.map((intake) => (
            <li
              key={intake.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="font-medium text-ink">
                {intake.name}
                {intake.dose ? ` · ${intake.dose}` : ""}
              </span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleUndo(intake.id)}
                className="rounded-md px-2 py-1 text-xs font-semibold text-muted hover:text-danger disabled:opacity-50"
              >
                Undo
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Nothing logged yet today.</p>
      )}
    </section>
  );
}
