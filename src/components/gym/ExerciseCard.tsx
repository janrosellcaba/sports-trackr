"use client";

import { useEffect, useState, useTransition } from "react";
import { useRestTimer } from "@/components/gym/RestTimer";
import { estimatedOneRm } from "@/lib/calculations";
import { runMutation } from "@/lib/offline/mutate";
import { CARD_CLS, LABEL_CLS, PRIMARY_BTN } from "@/lib/ui";
import type { ExercisePayload, SetPayload } from "@/types/trackr";

type ExerciseCardProps = {
  exercise: ExercisePayload;
  enableRestTimer?: boolean;
  onChange: (exercise: ExercisePayload) => void;
  onDelete: () => void;
};

export function ExerciseCard({
  exercise,
  enableRestTimer = true,
  onChange,
  onDelete,
}: ExerciseCardProps) {
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
      const id = crypto.randomUUID();
      const optimistic: SetPayload = {
        id,
        setNumber: exercise.sets.length + 1,
        weight: parsedWeight,
        reps: parsedReps,
        rpe: parsedRpe ?? null,
      };
      const result = await runMutation(
        "addSet",
        {
          id,
          exerciseLogId: exercise.id,
          weight: parsedWeight,
          reps: parsedReps,
          rpe: parsedRpe,
        },
        optimistic,
      );
      onChange({ ...exercise, sets: [...exercise.sets, result.data] });
      if (enableRestTimer) restTimer?.start();
    });
  }

  function handleDeleteExercise() {
    const confirmed = window.confirm(`Remove ${exercise.machineName}?`);
    if (!confirmed) return;

    startTransition(async () => {
      await runMutation("deleteExercise", { exerciseLogId: exercise.id }, undefined);
      onDelete();
    });
  }

  function handleDeleteSet(setId: string) {
    startTransition(async () => {
      await runMutation("deleteSet", { setId }, undefined);
      onChange({
        ...exercise,
        sets: exercise.sets.filter((set) => set.id !== setId),
      });
    });
  }

  return (
    <article className={`${CARD_CLS} p-4`}>
      <header className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-ink">{exercise.machineName}</h3>
        <button
          type="button"
          onClick={handleDeleteExercise}
          disabled={isPending}
          aria-label={`Delete ${exercise.machineName}`}
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-danger-soft hover:text-danger disabled:opacity-50"
        >
          ×
        </button>
      </header>

      <div className="mb-3 overflow-x-auto">
        <table className="w-full min-w-[280px] text-left text-sm">
          <thead>
            <tr className={LABEL_CLS}>
              <th className="pb-2 font-bold">Set</th>
              <th className="pb-2 font-bold">kg</th>
              <th className="pb-2 font-bold">Reps</th>
              <th className="pb-2 font-bold">1RM</th>
              <th className="pb-2 font-bold">RPE</th>
              <th className="pb-2 font-bold" />
            </tr>
          </thead>
          <tbody>
            {exercise.sets.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-3 text-muted">
                  No sets yet — log your first below.
                </td>
              </tr>
            ) : (
              exercise.sets.map((set) => (
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
                  <td className="py-2.5">
                    <span className="rounded-full bg-brand-soft px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums text-brand">
                      {estimatedOneRm(set.weight, set.reps)}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono tabular-nums text-muted">
                    {set.rpe ?? "—"}
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
          className={`${PRIMARY_BTN} flex w-full items-center justify-center gap-2 bg-brand py-3 text-base hover:bg-brand-dark`}
        >
          <span className="text-lg leading-none">+</span>
          Add Set
          <span className="font-mono text-xs opacity-80">
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
          placeholder={placeholder}
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
