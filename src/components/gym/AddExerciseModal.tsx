"use client";

import { useMemo, useState, useTransition } from "react";
import { addExercise } from "@/app/actions/gym";
import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  EXERCISE_CATALOG,
  MUSCLE_FILTERS,
  type MuscleFilter,
} from "@/lib/exercises";
import { INPUT_CLS, PRIMARY_BTN, chipClass } from "@/lib/ui";

type AddExerciseModalProps = {
  sessionId: string;
  open: boolean;
  onClose: () => void;
};

export function AddExerciseModal({
  sessionId,
  open,
  onClose,
}: AddExerciseModalProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MuscleFilter>("All");
  const [isPending, startTransition] = useTransition();

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return EXERCISE_CATALOG.filter((exercise) => {
      const matchesFilter =
        filter === "All" || exercise.category === filter;
      const matchesQuery =
        !normalized || exercise.name.toLowerCase().includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  if (!open) return null;

  function submit(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;

    startTransition(async () => {
      await addExercise(sessionId, trimmed);
      setQuery("");
      setFilter("All");
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
            key={exercise.name}
            type="button"
            disabled={isPending}
            onClick={() => submit(exercise.name)}
            className="rounded-full bg-chip px-4 py-2.5 text-sm font-medium text-ink transition-colors duration-150 hover:bg-chip-hover disabled:opacity-50"
          >
            {exercise.name}
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
