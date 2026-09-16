"use client";

import { useMemo, useTransition, useState } from "react";
import { deleteSupplement, logSupplement } from "@/app/actions/supplements";
import { mergeSupplementCatalog } from "@/lib/catalog";
import { formatDisplayDate } from "@/lib/calculations";
import { CARD_CLS, GHOST_BTN, LABEL_CLS } from "@/lib/ui";
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
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const catalog = useMemo(
    () => mergeSupplementCatalog(customSupplements),
    [customSupplements],
  );

  function handleQuickLog(item: (typeof catalog)[number]) {
    setError(null);
    setPendingId(item.id);
    startTransition(async () => {
      try {
        const logged = await logSupplement({
          name: item.name,
          dose: item.defaultDose,
          date,
        });
        onChange([logged, ...intakes.filter((row) => row.id !== logged.id)]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not log.");
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleUndo(id: string) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      try {
        await deleteSupplement(id);
        onChange(intakes.filter((item) => item.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not undo.");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <section className={`${CARD_CLS} space-y-3 p-4`}>
      <div>
        <p className={LABEL_CLS}>Supplements</p>
        <h2 className="text-base font-bold text-ink">Tap to log</h2>
        <p className="mt-0.5 text-xs text-muted">{formatDisplayDate(date)}</p>
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
              disabled={pendingId != null}
              onClick={() => handleQuickLog(item)}
              className="flex h-12 items-center justify-center rounded-xl bg-chip text-sm font-bold text-ink transition-all duration-150 hover:bg-chip-hover active:scale-[0.98] disabled:opacity-60"
            >
              {pendingId === item.id ? "Saving…" : `+ ${item.name}`}
            </button>
          ))}
        </div>
      )}

      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}

      {intakes.length > 0 ? (
        <ul className="space-y-1.5 border-t border-line pt-3">
          {intakes.map((intake) => (
            <li
              key={intake.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="min-w-0 truncate font-medium text-ink">
                {intake.name}
                {intake.dose ? ` · ${intake.dose}` : ""}
              </span>
              <button
                type="button"
                disabled={pendingId != null}
                onClick={() => handleUndo(intake.id)}
                className={GHOST_BTN}
              >
                {pendingId === intake.id ? "…" : "Undo"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Nothing logged yet for this day.</p>
      )}
    </section>
  );
}
