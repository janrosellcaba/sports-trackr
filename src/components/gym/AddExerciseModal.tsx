"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { addExercise, addSet } from "@/app/actions/gym";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { DateField } from "@/components/ui/DayPicker";
import { mergeExerciseCatalog, muscleGroupLabel } from "@/lib/catalog";
import { MUSCLE_FILTERS, type MuscleFilter } from "@/lib/exercises";
import { INPUT_CLS, PRIMARY_BTN, chipClass } from "@/lib/ui";
import type { CustomExercisePayload, WorkoutPayload } from "@/types/trackr";

type AddExerciseModalProps = {
  date: string;
  open: boolean;
  customExercises: CustomExercisePayload[];
  onClose: () => void;
  onAdded: (workout: WorkoutPayload) => void;
};

export function AddExerciseModal({
  date,
  open,
  customExercises,
  onClose,
  onAdded,
}: AddExerciseModalProps) {
  const [query, setQuery] = useState("");
  const [logDate, setLogDate] = useState(date);
  const [filter, setFilter] = useState<MuscleFilter>("All");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) setLogDate(date);
  }, [open, date]);

  const catalog = useMemo(
    () => mergeExerciseCatalog(customExercises),
    [customExercises],
  );

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return catalog.filter((exercise) => {
      const matchesFilter =
        filter === "All" || muscleGroupLabel(exercise.muscleGroup) === filter;
      const matchesQuery =
        !normalized || exercise.name.toLowerCase().includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [catalog, filter, query]);

  if (!open) return null;

  function submit(
    name: string,
    defaults?: { weight?: number | null; reps?: number | null },
  ) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      try {
        let workout = await addExercise({ date: logDate, name: trimmed });
        const weight = defaults?.weight;
        const reps = defaults?.reps;
        const added = workout.exercises[workout.exercises.length - 1];
        if (
          added &&
          typeof weight === "number" &&
          Number.isFinite(weight) &&
          typeof reps === "number" &&
          Number.isInteger(reps) &&
          reps > 0
        ) {
          const set = await addSet({
            exerciseLogId: added.id,
            weight,
            reps,
          });
          workout = {
            ...workout,
            exercises: workout.exercises.map((exercise) =>
              exercise.id === added.id
                ? { ...exercise, sets: [...exercise.sets, set] }
                : exercise,
            ),
            setCount: workout.setCount + 1,
            totalVolumeKg: workout.totalVolumeKg + Math.round(weight * reps),
          };
        }
        setQuery("");
        setFilter("All");
        onAdded(workout);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add exercise.");
      }
    });
  }

  return (
    <BottomSheet title="Add exercise" onClose={onClose}>
      <form
        className="mb-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          submit(query);
        }}
      >
        <DateField value={logDate} onChange={setLogDate} />
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-ink">
            Exercise
          </span>
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search or type a name…"
            className={INPUT_CLS}
          />
        </label>
        {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
        <button
          type="submit"
          disabled={isPending || !query.trim()}
          className={`${PRIMARY_BTN} w-full bg-brand hover:bg-brand-dark`}
        >
          {isPending ? "Adding…" : "Add"}
        </button>
      </form>

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {MUSCLE_FILTERS.map((group) => (
          <button
            key={group}
            type="button"
            onClick={() => setFilter(group)}
            className={`shrink-0 ${chipClass(filter === group)} !rounded-full px-3 py-1.5 text-xs`}
          >
            {group}
          </button>
        ))}
      </div>

      <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto pb-2">
        {suggestions.map((exercise) => (
          <button
            key={exercise.id}
            type="button"
            disabled={isPending}
            onClick={() =>
              submit(exercise.name, {
                weight: exercise.defaultWeight,
                reps: exercise.defaultReps,
              })
            }
            className="rounded-full bg-chip px-4 py-2.5 text-sm font-medium text-ink transition-colors duration-150 hover:bg-chip-hover disabled:opacity-50"
          >
            {exercise.name}
          </button>
        ))}
        {suggestions.length === 0 && (
          <p className="text-sm text-muted">
            No matches — type a name and tap Add.
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
