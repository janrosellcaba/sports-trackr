"use client";

import { formatDisplayDate } from "@/lib/calculations";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";
import { WorkoutEditor } from "@/components/gym/WorkoutEditor";
import { SportsBar } from "@/components/sports/SportsBar";
import { SupplementBar } from "@/components/supplements/SupplementBar";
import type {
  CustomExercisePayload,
  CustomSupplementPayload,
  SportSessionPayload,
  SupplementPayload,
  WorkoutPayload,
} from "@/types/trackr";

export function HomeView({
  today,
  todayWorkout,
  todaySports,
  todaySupplements,
  recentWorkouts,
  customExercises,
  customSupplements,
  onWorkoutChange,
  onSportsChange,
  onSupplementsChange,
}: {
  today: string;
  todayWorkout: WorkoutPayload | null;
  todaySports: SportSessionPayload[];
  todaySupplements: SupplementPayload[];
  recentWorkouts: WorkoutPayload[];
  customExercises: CustomExercisePayload[];
  customSupplements: CustomSupplementPayload[];
  onWorkoutChange: (workout: WorkoutPayload | null) => void;
  onSportsChange: (sessions: SportSessionPayload[]) => void;
  onSupplementsChange: (intakes: SupplementPayload[]) => void;
}) {
  const volume = todayWorkout?.totalVolumeKg ?? 0;
  const sets = todayWorkout?.setCount ?? 0;
  const exercises = todayWorkout?.exercises.length ?? 0;
  const empty =
    exercises === 0 && todaySupplements.length === 0 && todaySports.length === 0;

  const summaryParts: string[] = [];
  if (exercises > 0) {
    summaryParts.push(
      `${exercises} exercise${exercises === 1 ? "" : "s"} · ${volume.toLocaleString()}kg`,
    );
  }
  if (todaySports.length > 0) {
    summaryParts.push(
      `${todaySports.length} sport${todaySports.length === 1 ? "" : "s"}`,
    );
  }
  if (todaySupplements.length > 0) {
    summaryParts.push(
      `${todaySupplements.length} supplement${todaySupplements.length === 1 ? "" : "s"}`,
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-paper p-6 text-center shadow-sm">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand/10 via-transparent to-transparent" />
        <p className={`relative ${LABEL_CLS}`}>Today</p>
        <p className="relative mt-2 text-3xl font-extrabold tracking-tight text-ink">
          {empty ? "Log it" : sets > 0 ? `${sets} sets` : "Logged"}
        </p>
        <p className="relative mt-1 text-sm text-muted">
          {empty
            ? "Gym, sports, and supplements. No timers."
            : summaryParts.join(" · ")}
        </p>
      </div>

      <SupplementBar
        date={today}
        intakes={todaySupplements}
        customSupplements={customSupplements}
        onChange={onSupplementsChange}
      />

      <SportsBar date={today} sessions={todaySports} onChange={onSportsChange} />

      <div>
        <h2 className={`mb-3 ${LABEL_CLS}`}>Gym</h2>
        <WorkoutEditor
          date={today}
          workout={todayWorkout}
          customExercises={customExercises}
          onChange={onWorkoutChange}
        />
      </div>

      {recentWorkouts.length > 0 ? (
        <div>
          <h2 className={`mb-3 ${LABEL_CLS}`}>Recent gym days</h2>
          <div className="space-y-2">
            {recentWorkouts.slice(0, 4).map((workout) => (
              <article key={workout.id} className={`${CARD_CLS} px-4 py-3`}>
                <p className="text-sm font-bold text-ink">
                  {formatDisplayDate(workout.date)}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {workout.exercises.length} exercises · {workout.setCount} sets ·{" "}
                  {workout.totalVolumeKg.toLocaleString()}kg
                </p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
