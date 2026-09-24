"use client";

import { useState, useTransition } from "react";
import { deleteBodyWeight, saveBodyWeight } from "@/app/actions/weight";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useUnits } from "@/components/units/UnitsProvider";
import { formatDisplayDate } from "@/lib/calculations";
import { parseDecimal } from "@/lib/numbers";
import {
  displayToKg,
  formatInputNumber,
  formatMass,
  kgToDisplay,
  massLabel,
} from "@/lib/units";
import {
  CARD_CLS,
  GHOST_BTN,
  INPUT_CLS,
  LABEL_CLS,
  PRIMARY_BTN,
  SECONDARY_BTN,
} from "@/lib/ui";
import type { BodyWeightPayload } from "@/types/trackr";

export function BodyWeightBar({
  date,
  entry,
  onChange,
  onRemoved,
}: {
  date: string;
  entry: BodyWeightPayload | null;
  onChange: (entry: BodyWeightPayload) => void;
  onRemoved: () => void;
}) {
  const { massUnit } = useUnits();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function clear() {
    if (!entry) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteBodyWeight(entry.id);
        onRemoved();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not clear.");
      }
    });
  }

  return (
    <section className={`${CARD_CLS} space-y-3 p-4`}>
      <p className={LABEL_CLS}>Body weight</p>

      {entry ? (
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-sm font-semibold tabular-nums text-ink">
            {formatMass(entry.weightKg, massUnit)}
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={clear}
            className={GHOST_BTN}
          >
            {pending ? "…" : "Clear"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted">None for this day.</p>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen(true)}
        className={SECONDARY_BTN}
      >
        {entry ? "Update weight" : "Log weight"}
      </button>

      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}

      {open ? (
        <WeightSheet
          date={date}
          initialKg={entry?.weightKg ?? null}
          onClose={() => setOpen(false)}
          onSave={(row) => {
            onChange(row);
            setOpen(false);
            setError(null);
          }}
        />
      ) : null}
    </section>
  );
}

function WeightSheet({
  date,
  initialKg,
  onClose,
  onSave,
}: {
  date: string;
  initialKg: number | null;
  onClose: () => void;
  onSave: (entry: BodyWeightPayload) => void;
}) {
  const { massUnit } = useUnits();
  const [weight, setWeight] = useState(
    initialKg != null ? formatInputNumber(kgToDisplay(initialKg, massUnit)) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <BottomSheet title={initialKg == null ? "Log weight" : "Update weight"} onClose={onClose}>
      <p className="mb-3 text-sm text-muted">{formatDisplayDate(date)}</p>
      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-semibold text-ink">{massLabel(massUnit)}</span>
        <input
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
          inputMode="decimal"
          className={INPUT_CLS}
          aria-label="Body weight"
        />
      </label>
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
              const parsed = parseDecimal(weight);
              if (parsed == null) throw new Error("Weight is required.");
              const row = await saveBodyWeight({
                date,
                weightKg: displayToKg(parsed, massUnit),
              });
              onSave(row);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not save.");
            }
          });
        }}
      >
        {pending ? "Saving…" : "Save weight"}
      </button>
    </BottomSheet>
  );
}
