"use client";

import { useState } from "react";
import type { ExercisePayload } from "@/types/trackr";
import { AddExerciseModal } from "@/components/gym/AddExerciseModal";
import { ExerciseCard } from "@/components/gym/ExerciseCard";
import { CARD_CLS, LABEL_CLS, PRIMARY_BTN } from "@/lib/ui";

type ExerciseListProps = {
  sessionId: string;
  exercises: ExercisePayload[];
};

export function ExerciseList({ sessionId, exercises }: ExerciseListProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className={LABEL_CLS}>Exercises</h2>
        <span className="text-xs font-medium text-muted">
          {exercises.length} logged
        </span>
      </div>

      {exercises.length === 0 ? (
        <div className={`${CARD_CLS} border-dashed px-4 py-8 text-center`}>
          <p className="text-sm text-muted">
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
        className={`${PRIMARY_BTN} w-full bg-brand hover:bg-brand-dark shadow-sm`}
      >
        + Add Exercise
      </button>

      <AddExerciseModal
        sessionId={sessionId}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
