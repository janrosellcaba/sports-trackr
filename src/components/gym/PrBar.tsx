"use client";

import { useMemo, useState, useTransition } from "react";
import { recordPersonalRecord } from "@/app/actions/catalog";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfettiBurst } from "@/components/ui/ConfettiBurst";
import { DateField } from "@/components/ui/DayPicker";
import { formatLift, isImprovedPersonalRecord } from "@/lib/catalog";
import { formatDisplayDate } from "@/lib/calculations";
import { CARD_CLS, INPUT_CLS, LABEL_CLS, PRIMARY_BTN } from "@/lib/ui";
import type { CustomExercisePayload } from "@/types/trackr";

export function PrBar({
  date,
  exercises,
  onChange,
}: {
  date: string;
  exercises: CustomExercisePayload[];
  onChange: (row: CustomExercisePayload) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomExercisePayload | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const records = useMemo(
    () =>
      [...exercises]
        .filter((item) => item.prWeight != null)
        .sort((a, b) => {
          const dateCmp = (b.prDate ?? "").localeCompare(a.prDate ?? "");
          return dateCmp !== 0 ? dateCmp : a.name.localeCompare(b.name);
        }),
    [exercises],
  );

  const canAdd = exercises.length > 0;

  return (
    <section className={`${CARD_CLS} space-y-3 p-4`}>
      <div>
        <p className={LABEL_CLS}>Personal records</p>
        <h2 className="text-base font-bold text-ink">Best lifts</h2>
      </div>

      {records.length > 0 ? (
        <ul className="max-h-64 space-y-1.5 overflow-y-auto">
          {records.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="flex w-full items-baseline justify-between gap-3 rounded-xl px-1 py-1.5 text-left hover:bg-chip/50"
                onClick={() => {
                  setEditing(item);
                  setOpen(true);
                }}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">
                    {item.name}
                  </span>
                  {item.prDate ? (
                    <span className="text-xs text-muted">
                      {formatDisplayDate(item.prDate)}
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-ink">
                  {formatLift(item.prWeight, item.prReps)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          {canAdd
            ? "No records yet. Log one when you hit it."
            : "Add a lift in Settings → Exercises first."}
        </p>
      )}

      <button
        type="button"
        disabled={!canAdd}
        onClick={() => {
          if (!canAdd) return;
          setEditing(null);
          setOpen(true);
        }}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-chip text-sm font-bold text-ink transition-all duration-150 hover:bg-chip-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        + Add PR
      </button>

      {open ? (
        <PrSheet
          date={date}
          exercises={exercises}
          initial={editing}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
          onSave={(row) => {
            const previous =
              exercises.find((item) => item.id === row.id) ?? editing;
            onChange(row);
            setOpen(false);
            setEditing(null);
            if (isImprovedPersonalRecord(previous, row)) {
              setCelebrate(true);
            }
          }}
        />
      ) : null}

      {celebrate ? <ConfettiBurst onDone={() => setCelebrate(false)} /> : null}
    </section>
  );
}

function PrSheet({
  date,
  exercises,
  initial,
  onClose,
  onSave,
}: {
  date: string;
  exercises: CustomExercisePayload[];
  initial: CustomExercisePayload | null;
  onClose: () => void;
  onSave: (row: CustomExercisePayload) => void;
}) {
  const sorted = useMemo(
    () => [...exercises].sort((a, b) => a.name.localeCompare(b.name)),
    [exercises],
  );
  const [exerciseId, setExerciseId] = useState(initial?.id ?? "");
  const [weight, setWeight] = useState(initial?.prWeight?.toString() ?? "");
  const [reps, setReps] = useState(initial?.prReps?.toString() ?? "");
  const [prDate, setPrDate] = useState(initial?.prDate ?? date);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <BottomSheet title={initial ? `Update ${initial.name}` : "Add PR"} onClose={onClose}>
      {initial ? null : (
        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-semibold text-ink">Exercise</span>
          <select
            value={exerciseId}
            onChange={(event) => {
              const nextId = event.target.value;
              setExerciseId(nextId);
              const found = sorted.find((item) => item.id === nextId);
              setWeight(found?.prWeight != null ? String(found.prWeight) : "");
              setReps(found?.prReps != null ? String(found.prReps) : "");
              setPrDate(found?.prDate ?? date);
            }}
            className={INPUT_CLS}
          >
            <option value="">Select a lift</option>
            {sorted.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.prWeight != null
                  ? ` · ${formatLift(item.prWeight, item.prReps)}`
                  : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="mb-3 grid grid-cols-2 gap-2">
        <label>
          <span className="mb-1 block text-sm font-semibold text-ink">kg</span>
          <input
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            inputMode="decimal"
            className={INPUT_CLS}
          />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold text-ink">Reps</span>
          <input
            value={reps}
            onChange={(event) => setReps(event.target.value)}
            inputMode="numeric"
            className={INPUT_CLS}
          />
        </label>
      </div>
      <DateField value={prDate} onChange={setPrDate} />
      {error ? <p className="mb-3 text-sm font-medium text-danger">{error}</p> : null}
      <button
        type="button"
        disabled={pending}
        className={`${PRIMARY_BTN} w-full bg-brand hover:bg-brand-dark`}
        onClick={() => {
          startTransition(async () => {
            try {
              const id = initial?.id ?? exerciseId;
              if (!id) throw new Error("Pick an exercise.");
              const row = await recordPersonalRecord({
                exerciseId: id,
                prWeight: weight ? Number(weight) : null,
                prReps: reps ? Number(reps) : null,
                prDate: prDate || null,
              });
              onSave(row);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not save.");
            }
          });
        }}
      >
        Save PR
      </button>
    </BottomSheet>
  );
}
