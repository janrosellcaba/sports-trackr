"use client";

import { useMemo, useState, useTransition } from "react";
import { addExercise } from "@/app/actions/gym";
import {
  EXERCISE_CATALOG,
  MUSCLE_FILTERS,
  type MuscleFilter,
} from "@/lib/exercises";

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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-lg rounded-t-2xl border border-neutral-850 bg-black p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-neutral-100">
            Add exercise
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-850 px-3 py-2 text-sm text-neutral-400"
          >
            Close
          </button>
        </div>

        <form
          className="mb-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            submit(query);
          }}
        >
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search or type custom…"
            className="h-12 flex-1 rounded-xl border border-neutral-850 bg-neutral-950 px-4 text-base text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-lime-400/50"
          />
          <button
            type="submit"
            disabled={isPending || !query.trim()}
            className="h-12 shrink-0 rounded-xl bg-lime-400 px-4 text-sm font-semibold text-neutral-950 disabled:opacity-50"
          >
            Add
          </button>
        </form>

        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
          {MUSCLE_FILTERS.map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => setFilter(group)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filter === group
                  ? "bg-lime-400 text-neutral-950"
                  : "border border-neutral-850 bg-neutral-950 text-neutral-400"
              }`}
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
              className="rounded-full border border-neutral-850 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-200 transition active:scale-[0.98] hover:border-lime-400/40 hover:text-lime-300 disabled:opacity-50"
            >
              {exercise.name}
            </button>
          ))}
          {suggestions.length === 0 && (
            <p className="text-sm text-neutral-500">
              No matches — use the input to add a custom exercise.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
