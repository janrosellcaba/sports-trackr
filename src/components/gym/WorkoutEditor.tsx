"use client";

import { useState } from "react";
import { AddExerciseModal } from "@/components/gym/AddExerciseModal";
import { ExerciseCard } from "@/components/gym/ExerciseCard";
import { workoutTonnage } from "@/lib/calculations";
import { CARD_CLS, PRIMARY_BTN } from "@/lib/ui";
import type {
  CustomExercisePayload,
  ExercisePayload,
  WorkoutPayload,
} from "@/types/trackr";

function withTotals(workout: WorkoutPayload): WorkoutPayload {
  const allSets = workout.exercises.flatMap((exercise) => exercise.sets);
  return {
    ...workout,
    setCount: allSets.length,
    totalVolumeKg: Math.round(workoutTonnage(allSets)),
  };
}

export function WorkoutEditor({
  date,
  workout,
  customExercises,
  onChange,
}: {
  date: string;
  workout: WorkoutPayload | null;
  customExercises: CustomExercisePayload[];
  onChange: (workout: WorkoutPayload | null) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const exercises = workout?.exercises ?? [];

  function updateExercise(next: ExercisePayload) {
    if (!workout) return;
    onChange(
      withTotals({
        ...workout,
        exercises: workout.exercises.map((item) =>
          item.id === next.id ? next : item,
        ),
      }),
    );
  }

  function removeExercise(id: string) {
    if (!workout) return;
    const exercisesNext = workout.exercises.filter((item) => item.id !== id);
    onChange(
      exercisesNext.length === 0
        ? { ...workout, exercises: [], setCount: 0, totalVolumeKg: 0 }
        : withTotals({ ...workout, exercises: exercisesNext }),
    );
  }

  return (
    <section className="space-y-4">
      {exercises.length === 0 ? (
        <div className={`${CARD_CLS} border-dashed px-4 py-8 text-center`}>
          <p className="text-sm text-muted">
            Add an exercise, then log weight and reps. That’s it.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
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
        + Add exercise
      </button>

      <AddExerciseModal
        date={date}
        open={modalOpen}
        customExercises={customExercises}
        onClose={() => setModalOpen(false)}
        onAdded={onChange}
      />
    </section>
  );
}
