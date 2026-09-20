"use client";

import { useState, useTransition } from "react";
import { deleteSupplement, logSupplement, updateSupplement } from "@/app/actions/supplements";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { DateField } from "@/components/ui/DayPicker";
import { formatDisplayDate } from "@/lib/calculations";
import {
  COFFEE_SIZES,
  SUPPLEMENTS,
  amountFromDose,
  type SupplementDefinition,
  supplementFromName,
} from "@/lib/supplements";
import { CARD_CLS, GHOST_BTN, INPUT_CLS, LABEL_CLS, PRIMARY_BTN, SECONDARY_BTN, TAP_ROW, chipClass } from "@/lib/ui";
import type { SupplementPayload } from "@/types/trackr";

export function SupplementBar({
  date,
  intakes,
  lockDate = true,
  onChange,
}: {
  date: string;
  intakes: SupplementPayload[];
  lockDate?: boolean;
  onChange: (intakes: SupplementPayload[]) => void;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [creating, setCreating] = useState<SupplementDefinition | null>(null);
  const [editing, setEditing] = useState<SupplementPayload | null>(null);
  const editingKind = editing ? supplementFromName(editing.name) : null;

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

  function commit(logged: SupplementPayload) {
    onChange([logged, ...intakes.filter((row) => row.id !== logged.id)]);
  }

  return (
    <section className={`${CARD_CLS} space-y-3 p-4`}>
      <div>
        <p className={LABEL_CLS}>Supplements</p>
        <h2 className="text-base font-bold text-ink">Tap to log</h2>
        <p className="mt-0.5 text-xs text-muted">{formatDisplayDate(date)}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {SUPPLEMENTS.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={pendingId != null}
            onClick={() => setCreating(item)}
            className={SECONDARY_BTN}
          >
            + {item.name}
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}

      {intakes.length > 0 ? (
        <ul className="space-y-1.5 border-t border-line pt-3">
          {intakes.map((intake) => {
            const kind = supplementFromName(intake.name);
            const label = `${intake.name}${intake.dose ? ` · ${intake.dose}` : ""}`;
            return (
              <li
                key={intake.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                {kind ? (
                  <button
                    type="button"
                    className={`min-w-0 flex-1 truncate text-left font-medium text-ink ${TAP_ROW}`}
                    onClick={() => setEditing(intake)}
                  >
                    {label}
                  </button>
                ) : (
                  <span className="min-w-0 flex-1 truncate font-medium text-ink">
                    {label}
                  </span>
                )}
                <button
                  type="button"
                  disabled={pendingId != null}
                  onClick={() => handleUndo(intake.id)}
                  className={GHOST_BTN}
                >
                  {pendingId === intake.id ? "…" : "Undo"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted">Nothing logged yet for this day.</p>
      )}

      {creating ? (
        <SupplementFormSheet
          date={date}
          kind={creating}
          lockDate={lockDate}
          onClose={() => setCreating(null)}
          onSave={(logged) => {
            commit(logged);
            setCreating(null);
          }}
        />
      ) : null}

      {editing && editingKind ? (
        <SupplementFormSheet
          date={editing.date}
          kind={editingKind}
          initial={editing}
          lockDate={false}
          onClose={() => setEditing(null)}
          onSave={(logged) => {
            commit(logged);
            setEditing(null);
          }}
        />
      ) : null}
    </section>
  );
}

export function SupplementFormSheet({
  date,
  kind,
  initial,
  lockDate = false,
  onClose,
  onSave,
}: {
  date: string;
  kind: SupplementDefinition;
  initial?: SupplementPayload | null;
  lockDate?: boolean;
  onClose: () => void;
  onSave: (intake: SupplementPayload) => void;
}) {
  const [logDate, setLogDate] = useState(initial?.date ?? date);
  const [amount, setAmount] = useState(
    initial ? amountFromDose(kind.id, initial.dose) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <BottomSheet
      title={initial ? `Edit ${kind.name}` : kind.name}
      onClose={onClose}
    >
      {!lockDate ? <DateField value={logDate} onChange={setLogDate} /> : null}

      {kind.amountKind === "grams" ? (
        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-semibold text-ink">
            Protein (g)
          </span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder={kind.placeholder}
            className={INPUT_CLS}
          />
        </label>
      ) : null}

      {kind.amountKind === "ml" ? (
        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-semibold text-ink">
            Amount (ml)
          </span>
          <input
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder={kind.placeholder}
            className={INPUT_CLS}
          />
        </label>
      ) : null}

      {kind.amountKind === "size" ? (
        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold text-ink">Size</p>
          <div className="grid grid-cols-2 gap-2">
            {COFFEE_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setAmount(size)}
                className={chipClass(amount === size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mb-3 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={pending}
        className={`${PRIMARY_BTN} w-full bg-brand hover:bg-brand-dark`}
        onClick={() => {
          startTransition(async () => {
            try {
              const payload = {
                type: kind.id,
                amount,
                date: logDate,
              };
              const logged = initial
                ? await updateSupplement({ id: initial.id, ...payload })
                : await logSupplement(payload);
              onSave(logged);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not save.");
            }
          });
        }}
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </BottomSheet>
  );
}
