"use client";

import { formatDisplayDate } from "@/lib/calculations";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";
import { WorkoutEditor } from "@/components/gym/WorkoutEditor";
import { SportsBar } from "@/components/sports/SportsBar";
import { SupplementBar } from "@/components/supplements/SupplementBar";
import { DayPicker } from "@/components/ui/DayPicker";
import type {
  CustomExercisePayload,
  CustomSupplementPayload,
  SportSessionPayload,
  SupplementPayload,
  WorkoutPayload,
} from "@/types/trackr";

export function HomeView({
  today,
  date,
  onDateChange,
  workout,
  sports,
  supplements,
  recentWorkouts,
  customExercises,
  customSupplements,
  onWorkoutChange,
  onSportLogged,
  onSportRemoved,
  onSupplementsChange,
}: {
  today: string;
  date: string;
  onDateChange: (date: string) => void;
  workout: WorkoutPayload | null;
  sports: SportSessionPayload[];
  supplements: SupplementPayload[];
  recentWorkouts: WorkoutPayload[];
  customExercises: CustomExercisePayload[];
  customSupplements: CustomSupplementPayload[];
  onWorkoutChange: (workout: WorkoutPayload | null) => void;
  onSportLogged: (session: SportSessionPayload) => void;
  onSportRemoved: (id: string) => void;
  onSupplementsChange: (intakes: SupplementPayload[]) => void;
}) {
  const volume = workout?.totalVolumeKg ?? 0;
  const sets = workout?.setCount ?? 0;
  const exercises = workout?.exercises.length ?? 0;
  const empty = exercises === 0 && supplements.length === 0 && sports.length === 0;
  const isToday = date === today;

  const summaryParts: string[] = [];
  if (exercises > 0) {
    summaryParts.push(
      `${exercises} exercise${exercises === 1 ? "" : "s"} · ${volume.toLocaleString()}kg`,
    );
  }
  if (supplements.length > 0) {
    summaryParts.push(
      `${supplements.length} supplement${supplements.length === 1 ? "" : "s"}`,
    );
  }
  if (sports.length > 0) {
    summaryParts.push(`${sports.length} sport${sports.length === 1 ? "" : "s"}`);
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-paper p-6 text-center shadow-sm">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand/10 via-transparent to-transparent" />
        <p className={`relative ${LABEL_CLS}`}>
          {isToday ? "Today" : formatDisplayDate(date)}
        </p>
        <p className="relative mt-2 text-3xl font-extrabold tracking-tight text-ink">
          {empty ? "Log it" : sets > 0 ? `${sets} sets` : "Logged"}
        </p>
        <p className="relative mt-1 text-sm text-muted">
          {empty
            ? isToday
              ? "Gym, supplements, then sports. No timers."
              : "Logging a past day."
            : summaryParts.join(" · ")}
        </p>
        <div className="relative mt-4">
          <DayPicker today={today} date={date} onChange={onDateChange} />
        </div>
      </div>

      <div>
        <h2 className={`mb-3 ${LABEL_CLS}`}>Gym</h2>
        <WorkoutEditor
          date={date}
          workout={workout}
          customExercises={customExercises}
          onChange={onWorkoutChange}
        />
      </div>

      <SupplementBar
        date={date}
        intakes={supplements}
        customSupplements={customSupplements}
        onChange={onSupplementsChange}
      />

      <SportsBar
        date={date}
        sessions={sports}
        onLogged={onSportLogged}
        onRemoved={onSportRemoved}
      />

      {recentWorkouts.length > 0 ? (
        <div>
          <h2 className={`mb-3 ${LABEL_CLS}`}>Recent gym days</h2>
          <div className="space-y-2">
            {recentWorkouts.slice(0, 4).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onDateChange(item.date)}
                className={`${CARD_CLS} w-full px-4 py-3 text-left hover:bg-chip/40`}
              >
                <p className="text-sm font-bold text-ink">
                  {formatDisplayDate(item.date)}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {item.exercises.length} exercises · {item.setCount} sets ·{" "}
                  {item.totalVolumeKg.toLocaleString()}kg
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
