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

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <DayPicker today={today} date={date} onChange={onDateChange} />
        <div className={`${CARD_CLS} grid grid-cols-4 divide-x divide-line py-3`}>
          <DayStat label="Sets" value={String(sets)} />
          <DayStat
            label="kg"
            value={volume === 0 ? "0" : volume.toLocaleString()}
            accent={volume > 0}
          />
          <DayStat label="Sports" value={String(sports.length)} />
          <DayStat label="Supps" value={String(supplements.length)} />
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
                <p className="text-sm font-semibold text-ink">
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

function DayStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0 px-2 text-center">
      <p
        className={`truncate text-lg font-semibold tabular-nums ${
          accent ? "text-brand" : "text-ink"
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-muted">{label}</p>
    </div>
  );
}
