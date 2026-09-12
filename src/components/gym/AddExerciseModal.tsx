"use client";

import { useMemo, useState, useTransition } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { mergeExerciseCatalog, muscleGroupLabel } from "@/lib/catalog";
import { MUSCLE_FILTERS, type MuscleFilter } from "@/lib/exercises";
import { runMutation } from "@/lib/offline/mutate";
import { INPUT_CLS, PRIMARY_BTN, chipClass } from "@/lib/ui";
import type {
  CustomExercisePayload,
  ExercisePayload,
  SetPayload,
} from "@/types/trackr";

type AddExerciseModalProps = {
  sessionId: string;
  open: boolean;
  customExercises: CustomExercisePayload[];
  onClose: () => void;
  onAdded: (exercise: ExercisePayload) => void;
};

export function AddExerciseModal({
  sessionId,
  open,
  customExercises,
  onClose,
  onAdded,
}: AddExerciseModalProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MuscleFilter>("All");
  const [pinToCatalog, setPinToCatalog] = useState(false);
  const [isPending, startTransition] = useTransition();

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

  function submit(name: string, defaults?: { weight?: number | null; reps?: number | null }) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = crypto.randomUUID();
    const optimistic: ExercisePayload = {
      id,
      machineName: trimmed,
      order: 0,
      sets: [],
    };

    startTransition(async () => {
      const result = await runMutation(
        "addExercise",
        { id, sessionId, machineName: trimmed },
        optimistic,
      );
      let exercise = result.data;
      const weight = defaults?.weight;
      const reps = defaults?.reps;
      if (
        typeof weight === "number" &&
        Number.isFinite(weight) &&
        typeof reps === "number" &&
        Number.isInteger(reps) &&
        reps > 0
      ) {
        const setId = crypto.randomUUID();
        const optimisticSet: SetPayload = {
          id: setId,
          setNumber: 1,
          weight,
          reps,
          rpe: null,
        };
        const setResult = await runMutation(
          "addSet",
          {
            id: setId,
            exerciseLogId: exercise.id,
            weight,
            reps,
          },
          optimisticSet,
        );
        exercise = { ...exercise, sets: [...exercise.sets, setResult.data] };
      }
      if (pinToCatalog) {
        const catalogId = crypto.randomUUID();
        await runMutation(
          "createCustomExercise",
          {
            id: catalogId,
            name: trimmed,
            muscleGroup: filter === "All" ? "OTHER" : filter,
          },
          {
            id: catalogId,
            name: trimmed,
            muscleGroup: filter === "All" ? "OTHER" : filter,
            defaultWeight: null,
            defaultReps: null,
            createdAt: new Date().toISOString(),
          },
        );
      }
      setQuery("");
      setFilter("All");
      setPinToCatalog(false);
      onAdded(exercise);
      onClose();
    });
  }

  return (
    <BottomSheet title="Add Exercise" onClose={onClose}>
      <form
        className="mb-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          submit(query);
        }}
      >
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-ink">
            Exercise
          </span>
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search or type custom…"
            className={INPUT_CLS}
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-muted">
          <input
            type="checkbox"
            checked={pinToCatalog}
            onChange={(event) => setPinToCatalog(event.target.checked)}
            className="accent-brand"
          />
          Save to my catalog
        </label>
        <button
          type="submit"
          disabled={isPending || !query.trim()}
          className={`${PRIMARY_BTN} w-full bg-brand hover:bg-brand-dark`}
        >
          {isPending ? "Adding…" : "Add Custom"}
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
            {exercise.source === "custom" ? `★ ${exercise.name}` : exercise.name}
          </button>
        ))}
        {suggestions.length === 0 && (
          <p className="text-sm text-muted">
            No matches — use the input to add a custom exercise.
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
