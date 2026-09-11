"use client";

import { useState } from "react";
import type { ExercisePayload } from "@/types/trackr";
import { AddExerciseModal } from "@/components/gym/AddExerciseModal";
import { ExerciseCard } from "@/components/gym/ExerciseCard";

type ExerciseListProps = {
  sessionId: string;
  exercises: ExercisePayload[];
};

export function ExerciseList({ sessionId, exercises }: ExerciseListProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">
          Exercises
        </h2>
        <span className="text-xs text-neutral-500">
          {exercises.length} logged
        </span>
      </div>

      {exercises.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 px-4 py-8 text-center">
          <p className="text-sm text-neutral-400">
            No exercises yet. Add your first machine to start logging sets.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {exercises.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-lime-400/30 bg-lime-400/10 text-base font-semibold text-lime-300 transition active:scale-[0.98]"
      >
        <span className="text-xl leading-none">+</span>
        Add Exercise
      </button>

      <AddExerciseModal
        sessionId={sessionId}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
