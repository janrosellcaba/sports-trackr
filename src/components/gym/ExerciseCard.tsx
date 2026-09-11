"use client";

import { useEffect, useState, useTransition } from "react";
import { addSet, deleteExercise, deleteSet } from "@/app/actions/gym";
import { useRestTimer } from "@/components/gym/RestTimer";
import { estimatedOneRm } from "@/lib/calculations";
import type { ExercisePayload } from "@/types/trackr";

type ExerciseCardProps = {
  exercise: ExercisePayload;
};

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const restTimer = useRestTimer();
  const lastSet = exercise.sets[exercise.sets.length - 1];
  const [weight, setWeight] = useState(String(lastSet?.weight ?? 60));
  const [reps, setReps] = useState(String(lastSet?.reps ?? 10));
  const [rpe, setRpe] = useState(lastSet?.rpe != null ? String(lastSet.rpe) : "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const latest = exercise.sets[exercise.sets.length - 1];
    if (!latest) return;
    setWeight(String(latest.weight));
    setReps(String(latest.reps));
    setRpe(latest.rpe != null ? String(latest.rpe) : "");
  }, [exercise.sets]);

  function adjustNumber(
    value: string,
    delta: number,
    fallback: number,
    min = 0,
  ): string {
    const current = Number(value);
    const base = Number.isFinite(current) ? current : fallback;
    return String(Math.max(min, Math.round((base + delta) * 10) / 10));
  }

  function handleAddSet() {
    const parsedWeight = Number(weight);
    const parsedReps = Number(reps);
    const parsedRpe = rpe.trim() === "" ? undefined : Number(rpe);

    startTransition(async () => {
      await addSet(exercise.id, parsedWeight, parsedReps, parsedRpe);
      restTimer?.start();
    });
  }

  function handleDeleteExercise() {
    const confirmed = window.confirm(`Remove ${exercise.machineName}?`);
    if (!confirmed) return;

    startTransition(async () => {
      await deleteExercise(exercise.id);
    });
  }

  function handleDeleteSet(setId: string) {
    startTransition(async () => {
      await deleteSet(setId);
    });
  }

  return (
    <article className="rounded-2xl border border-neutral-850 bg-neutral-950/80 p-4">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-neutral-100">
          {exercise.machineName}
        </h3>
        <button
          type="button"
          onClick={handleDeleteExercise}
          disabled={isPending}
          aria-label={`Delete ${exercise.machineName}`}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800 text-neutral-400 transition hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
        >
          ×
        </button>
      </header>

      <div className="mb-3 overflow-x-auto">
        <table className="w-full min-w-[280px] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-neutral-500">
              <th className="pb-2 font-medium">Set</th>
              <th className="pb-2 font-medium">kg</th>
              <th className="pb-2 font-medium">Reps</th>
              <th className="pb-2 font-medium">1RM</th>
              <th className="pb-2 font-medium">RPE</th>
              <th className="pb-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {exercise.sets.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-3 text-neutral-500">
                  No sets yet — log your first below.
                </td>
              </tr>
            ) : (
              exercise.sets.map((set) => (
                <tr key={set.id} className="border-t border-neutral-850">
                  <td className="py-2.5 font-mono tabular-nums text-neutral-300">
                    {set.setNumber}
                  </td>
                  <td className="py-2.5 font-mono tabular-nums text-neutral-100">
                    {set.weight}
                  </td>
                  <td className="py-2.5 font-mono tabular-nums text-neutral-100">
                    {set.reps}
                  </td>
                  <td className="py-2.5">
                    <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-emerald-400">
                      {estimatedOneRm(set.weight, set.reps)}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono tabular-nums text-neutral-400">
                    {set.rpe ?? "—"}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteSet(set.id)}
                      disabled={isPending}
                      className="rounded-md px-2 py-1 text-xs text-neutral-500 hover:text-red-400 disabled:opacity-50"
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

      <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3">
        <div className="grid grid-cols-3 gap-2">
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
          <NumberStepper
            label="RPE"
            value={rpe}
            onChange={setRpe}
            onMinus={() =>
              setRpe((v) => (v === "" ? "7" : adjustNumber(v, -0.5, 7, 0)))
            }
            onPlus={() =>
              setRpe((v) => (v === "" ? "7.5" : adjustNumber(v, 0.5, 7, 0)))
            }
            inputMode="decimal"
            step="0.5"
            placeholder="—"
          />
        </div>

        <button
          type="button"
          onClick={handleAddSet}
          disabled={isPending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime-400 text-sm font-semibold text-neutral-950 transition active:scale-[0.98] disabled:opacity-60"
        >
          <span className="text-lg leading-none">+</span>
          Add Set
          <span className="font-mono text-xs opacity-70">
            {weight || "0"}kg × {reps || "0"}
          </span>
        </button>
      </div>
    </article>
  );
}

type NumberStepperProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onMinus: () => void;
  onPlus: () => void;
  inputMode: "decimal" | "numeric";
  step: string;
  placeholder?: string;
};

function NumberStepper({
  label,
  value,
  onChange,
  onMinus,
  onPlus,
  inputMode,
  step,
  placeholder,
}: NumberStepperProps) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onMinus}
          className="flex h-11 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-800 text-neutral-300"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode={inputMode}
          step={step}
          placeholder={placeholder}
          className="h-11 w-full min-w-0 rounded-lg border border-neutral-800 bg-neutral-900 text-center font-mono text-sm text-neutral-100 outline-none focus:border-lime-400/40"
        />
        <button
          type="button"
          onClick={onPlus}
          className="flex h-11 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-800 text-neutral-300"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </label>
  );
}
