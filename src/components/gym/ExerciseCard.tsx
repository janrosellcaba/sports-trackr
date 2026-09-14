"use client";

import { useEffect, useState, useTransition } from "react";
import { addSet, deleteExercise, deleteSet } from "@/app/actions/gym";
import { CARD_CLS, LABEL_CLS, PRIMARY_BTN } from "@/lib/ui";
import type { ExercisePayload, SetPayload } from "@/types/trackr";

type ExerciseCardProps = {
  exercise: ExercisePayload;
  onChange: (exercise: ExercisePayload) => void;
  onDelete: () => void;
};

export function ExerciseCard({ exercise, onChange, onDelete }: ExerciseCardProps) {
  const lastSet = exercise.sets[exercise.sets.length - 1];
  const [weight, setWeight] = useState(String(lastSet?.weight ?? 60));
  const [reps, setReps] = useState(String(lastSet?.reps ?? 10));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const latest = exercise.sets[exercise.sets.length - 1];
    if (!latest) return;
    setWeight(String(latest.weight));
    setReps(String(latest.reps));
  }, [exercise.sets]);

  function adjustNumber(value: string, delta: number, fallback: number, min = 0): string {
    const current = Number(value);
    const base = Number.isFinite(current) ? current : fallback;
    return String(Math.max(min, Math.round((base + delta) * 10) / 10));
  }

  function handleAddSet() {
    const parsedWeight = Number(weight);
    const parsedReps = Number(reps);
    if (!Number.isFinite(parsedWeight) || parsedWeight < 0) {
      setError("Enter a valid weight.");
      return;
    }
    if (!Number.isInteger(parsedReps) || parsedReps <= 0) {
      setError("Reps must be a whole number.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const set = await addSet({
          exerciseLogId: exercise.id,
          weight: parsedWeight,
          reps: parsedReps,
        });
        onChange({ ...exercise, sets: [...exercise.sets, set] });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add set.");
      }
    });
  }

  function handleDeleteExercise() {
    if (!window.confirm(`Remove ${exercise.name}?`)) return;
    startTransition(async () => {
      await deleteExercise(exercise.id);
      onDelete();
    });
  }

  function handleDeleteSet(setId: string) {
    startTransition(async () => {
      await deleteSet(setId);
      onChange({
        ...exercise,
        sets: exercise.sets.filter((set) => set.id !== setId),
      });
    });
  }

  return (
    <article className={`${CARD_CLS} p-4`}>
      <header className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-ink">{exercise.name}</h3>
        <button
          type="button"
          onClick={handleDeleteExercise}
          disabled={isPending}
          aria-label={`Delete ${exercise.name}`}
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-danger-soft hover:text-danger disabled:opacity-50"
        >
          ×
        </button>
      </header>

      <div className="mb-3 overflow-x-auto">
        <table className="w-full min-w-[220px] text-left text-sm">
          <thead>
            <tr className={LABEL_CLS}>
              <th className="pb-2 font-bold">Set</th>
              <th className="pb-2 font-bold">kg</th>
              <th className="pb-2 font-bold">Reps</th>
              <th className="pb-2 font-bold" />
            </tr>
          </thead>
          <tbody>
            {exercise.sets.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-3 text-muted">
                  No sets yet.
                </td>
              </tr>
            ) : (
              exercise.sets.map((set: SetPayload) => (
                <tr key={set.id} className="border-t border-line">
                  <td className="py-2.5 font-mono tabular-nums text-muted">
                    {set.setNumber}
                  </td>
                  <td className="py-2.5 font-mono font-semibold tabular-nums text-ink">
                    {set.weight}
                  </td>
                  <td className="py-2.5 font-mono font-semibold tabular-nums text-ink">
                    {set.reps}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteSet(set.id)}
                      disabled={isPending}
                      className="rounded-md px-2 py-1 text-xs font-semibold text-muted hover:text-danger disabled:opacity-50"
                    >
                      Del
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 rounded-2xl border border-line bg-cream/60 p-3">
        <div className="grid grid-cols-2 gap-2">
          <NumberStepper
            label="Weight"
            value={weight}
            onChange={setWeight}
            onMinus={() => setWeight((v) => adjustNumber(v, -2.5, 60))}
            onPlus={() => setWeight((v) => adjustNumber(v, 2.5, 60))}
            inputMode="decimal"
            step="0.5"
          />
          <NumberStepper
            label="Reps"
            value={reps}
            onChange={setReps}
            onMinus={() => setReps((v) => adjustNumber(v, -1, 10, 1))}
            onPlus={() => setReps((v) => adjustNumber(v, 1, 10, 1))}
            inputMode="numeric"
            step="1"
          />
        </div>
        {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
        <button
          type="button"
          onClick={handleAddSet}
          disabled={isPending}
          className={`${PRIMARY_BTN} flex w-full items-center justify-center gap-2 bg-brand py-3 text-base hover:bg-brand-dark`}
        >
          <span className="text-lg leading-none">+</span>
          Add set
          <span className="font-mono text-xs opacity-80">
            {weight || "0"}kg × {reps || "0"}
          </span>
        </button>
      </div>
    </article>
  );
}

function NumberStepper({
  label,
  value,
  onChange,
  onMinus,
  onPlus,
  inputMode,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onMinus: () => void;
  onPlus: () => void;
  inputMode: "decimal" | "numeric";
  step: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className={LABEL_CLS}>{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onMinus}
          className="flex h-11 w-9 shrink-0 items-center justify-center rounded-xl bg-chip text-ink transition-colors duration-150 hover:bg-chip-hover"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode={inputMode}
          step={step}
          className="h-11 w-full min-w-0 rounded-xl border border-line bg-paper text-center font-mono text-sm text-ink outline-none transition-colors duration-150 placeholder:text-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
        <button
          type="button"
          onClick={onPlus}
          className="flex h-11 w-9 shrink-0 items-center justify-center rounded-xl bg-chip text-ink transition-colors duration-150 hover:bg-chip-hover"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </label>
  );
}
