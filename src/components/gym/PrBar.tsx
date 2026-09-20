"use client";

import { useMemo, useState, useTransition } from "react";
import { recordPersonalRecord } from "@/app/actions/catalog";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { ConfettiBurst } from "@/components/ui/ConfettiBurst";
import { DateField } from "@/components/ui/DayPicker";
import { formatLift, isImprovedPersonalRecord } from "@/lib/catalog";
import { formatDisplayDate } from "@/lib/calculations";
import { parseDecimal } from "@/lib/numbers";
import { displayToKg, formatInputNumber, kgToDisplay, massLabel } from "@/lib/units";
import { useUnits } from "@/components/units/UnitsProvider";
import { CARD_CLS, INPUT_CLS, LABEL_CLS, PRIMARY_BTN, SECONDARY_BTN, SELECT_CLS, TAP_ROW } from "@/lib/ui";
import type { CustomExercisePayload } from "@/types/trackr";

export function PrBar({
  date,
  exercises,
  lockDate = false,
  onChange,
}: {
  date: string;
  exercises: CustomExercisePayload[];
  lockDate?: boolean;
  onChange: (row: CustomExercisePayload) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomExercisePayload | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const { massUnit } = useUnits();
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
      <p className={LABEL_CLS}>PRs</p>

      {records.length > 0 ? (
        <ul className="space-y-1.5 sm:max-h-64 sm:overflow-y-auto">
          {records.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`flex w-full items-baseline justify-between gap-3 py-1.5 text-left ${TAP_ROW}`}
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
                  {formatLift(item.prWeight, item.prReps, massUnit, item.dualWeights)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          {canAdd ? "None yet." : "Add a lift in Settings."}
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
        className={SECONDARY_BTN}
      >
        Add PR
      </button>

      {open ? (
        <PrSheet
          date={date}
          exercises={exercises}
          initial={editing}
          lockDate={lockDate}
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
  lockDate,
  onClose,
  onSave,
}: {
  date: string;
  exercises: CustomExercisePayload[];
  initial: CustomExercisePayload | null;
  lockDate: boolean;
  onClose: () => void;
  onSave: (row: CustomExercisePayload) => void;
}) {
  const { massUnit } = useUnits();
  const sorted = useMemo(
    () => [...exercises].sort((a, b) => a.name.localeCompare(b.name)),
    [exercises],
  );
  const [exerciseId, setExerciseId] = useState(initial?.id ?? "");
  const [weight, setWeight] = useState(
    initial?.prWeight != null ? formatInputNumber(kgToDisplay(initial.prWeight, massUnit)) : "",
  );
  const [reps, setReps] = useState(initial?.prReps?.toString() ?? "");
  const [prDate, setPrDate] = useState(initial?.prDate ?? date);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmLower, setConfirmLower] = useState(false);

  async function submit(allowDowngrade = false) {
    const id = initial?.id ?? exerciseId;
    if (!id) throw new Error("Pick an exercise.");
    const parsedWeight = parseDecimal(weight);
    const parsedReps = parseDecimal(reps);
    if (parsedWeight == null) throw new Error("PR weight is required.");
    if (parsedReps == null) throw new Error("PR reps are required.");
    return recordPersonalRecord({
      exerciseId: id,
      prWeight: displayToKg(parsedWeight, massUnit),
      prReps: parsedReps,
      prDate: lockDate ? date : prDate || null,
      allowDowngrade,
    });
  }

  return (
    <>
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
              setWeight(
                found?.prWeight != null
                  ? formatInputNumber(kgToDisplay(found.prWeight, massUnit))
                  : "",
              );
              setReps(found?.prReps != null ? String(found.prReps) : "");
              setPrDate(found?.prDate ?? date);
            }}
            className={SELECT_CLS}
          >
            <option value="">Select a lift</option>
            {sorted.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.prWeight != null
                  ? ` · ${formatLift(item.prWeight, item.prReps, massUnit, item.dualWeights)}`
                  : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="mb-3 grid grid-cols-2 gap-2">
        <label>
          <span className="mb-1 block text-sm font-semibold text-ink">
            {massLabel(massUnit)}
          </span>
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
      {lockDate ? null : <DateField value={prDate} onChange={setPrDate} />}
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
              const row = await submit(false);
              if ("needsConfirm" in row) {
                setConfirmLower(true);
                return;
              }
              onSave(row);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not save.");
            }
          });
        }}
      >
        {pending ? "Saving…" : "Save PR"}
      </button>
    </BottomSheet>
    {confirmLower ? (
      <ConfirmSheet
        title="Replace current PR?"
        body="Not a better PR. Replace it anyway?"
        confirmLabel="Replace PR"
        danger={false}
        pending={pending}
        onClose={() => setConfirmLower(false)}
        onConfirm={() => {
          startTransition(async () => {
            try {
              const row = await submit(true);
              if ("needsConfirm" in row) return;
              setConfirmLower(false);
              onSave(row);
            } catch (err) {
              setConfirmLower(false);
              setError(err instanceof Error ? err.message : "Could not save.");
            }
          });
        }}
      />
    ) : null}
    </>
  );
}
