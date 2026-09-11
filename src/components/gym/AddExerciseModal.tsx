"use client";

import { useMemo, useState, useTransition } from "react";
import { addExercise } from "@/app/actions/gym";

export const FREQUENT_EXERCISES = [
  "Bench Press",
  "Squat",
  "Incline Dumbbell Press",
  "Lat Pulldown",
  "Cable Row",
  "Leg Press",
  "Lateral Raises",
] as const;

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
  const [isPending, startTransition] = useTransition();

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [...FREQUENT_EXERCISES];
    return FREQUENT_EXERCISES.filter((name) =>
      name.toLowerCase().includes(normalized),
    );
  }, [query]);

  if (!open) return null;

  function submit(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;

    startTransition(async () => {
      await addExercise(sessionId, trimmed);
      setQuery("");
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

      <div className="relative z-10 w-full max-w-lg rounded-t-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-neutral-100">
            Add exercise
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-800 px-3 py-2 text-sm text-neutral-400"
          >
            Close
          </button>
        </div>

        <form
          className="mb-4 flex gap-2"
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
            className="h-12 flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-4 text-base text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-lime-400/50"
          />
          <button
            type="submit"
            disabled={isPending || !query.trim()}
            className="h-12 shrink-0 rounded-xl bg-lime-400 px-4 text-sm font-semibold text-neutral-950 disabled:opacity-50"
          >
            Add
          </button>
        </form>

        <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto pb-2">
          {suggestions.map((name) => (
            <button
              key={name}
              type="button"
              disabled={isPending}
              onClick={() => submit(name)}
              className="rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-neutral-200 transition active:scale-[0.98] hover:border-lime-400/40 hover:text-lime-300 disabled:opacity-50"
            >
              {name}
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
