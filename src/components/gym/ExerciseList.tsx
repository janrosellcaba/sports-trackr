"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import type { CustomExercisePayload, ExercisePayload, SessionPayload } from "@/types/trackr";
import { AddExerciseModal } from "@/components/gym/AddExerciseModal";
import { ExerciseCard } from "@/components/gym/ExerciseCard";
import { CARD_CLS, LABEL_CLS, PRIMARY_BTN } from "@/lib/ui";

type ExerciseListProps = {
  session: SessionPayload;
  onSessionChange: Dispatch<SetStateAction<SessionPayload | null>>;
  customExercises: CustomExercisePayload[];
  enableRestTimer: boolean;
};

export function ExerciseList({
  session,
  onSessionChange,
  customExercises,
  enableRestTimer,
}: ExerciseListProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const exercises = session.exercises;

  function patchSession(update: (current: SessionPayload) => SessionPayload) {
    onSessionChange((prev) => (prev ? update(prev) : prev));
  }

  function updateExercise(next: ExercisePayload) {
    patchSession((current) => ({
      ...current,
      exercises: current.exercises.map((item) =>
        item.id === next.id ? next : item,
      ),
    }));
  }

  function removeExercise(id: string) {
    patchSession((current) => ({
      ...current,
      exercises: current.exercises.filter((item) => item.id !== id),
    }));
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className={LABEL_CLS}>Exercises</h2>
        <Link href="/settings" className="text-xs font-bold text-muted hover:text-brand">
          Catalog
        </Link>
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
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              enableRestTimer={enableRestTimer}
              onChange={updateExercise}
              onDelete={() => removeExercise(exercise.id)}
            />
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
        sessionId={session.id}
        open={modalOpen}
        customExercises={customExercises}
        onClose={() => setModalOpen(false)}
        onAdded={(exercise) =>
          patchSession((current) => ({
            ...current,
            exercises: current.exercises.some((item) => item.id === exercise.id)
              ? current.exercises.map((item) =>
                  item.id === exercise.id ? exercise : item,
                )
              : [...current.exercises, exercise],
          }))
        }
      />
    </section>
  );
}
