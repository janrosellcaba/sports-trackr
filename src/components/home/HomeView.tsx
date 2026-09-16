"use client";

import { formatDisplayDate } from "@/lib/calculations";
import { averageIntensity, formatGymSummary } from "@/lib/muscles";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";
import { GymBar } from "@/components/gym/GymBar";
import { PrBar } from "@/components/gym/PrBar";
import { SportsBar } from "@/components/sports/SportsBar";
import { SupplementBar } from "@/components/supplements/SupplementBar";
import { DayPicker } from "@/components/ui/DayPicker";
import type {
  CustomExercisePayload,
  CustomSupplementPayload,
  GymSessionPayload,
  MusclePayload,
  SportSessionPayload,
  SupplementPayload,
} from "@/types/trackr";

export function HomeView({
  today,
  date,
  onDateChange,
  gym,
  sports,
  supplements,
  recentSessions,
  muscles,
  customExercises,
  customSupplements,
  onGymChange,
  onSportLogged,
  onSportRemoved,
  onSupplementsChange,
  onExerciseChange,
}: {
  today: string;
  date: string;
  onDateChange: (date: string) => void;
  gym: GymSessionPayload | null;
  sports: SportSessionPayload[];
  supplements: SupplementPayload[];
  recentSessions: GymSessionPayload[];
  muscles: MusclePayload[];
  customExercises: CustomExercisePayload[];
  customSupplements: CustomSupplementPayload[];
  onGymChange: (session: GymSessionPayload | null) => void;
  onSportLogged: (session: SportSessionPayload) => void;
  onSportRemoved: (id: string) => void;
  onSupplementsChange: (intakes: SupplementPayload[]) => void;
  onExerciseChange: (row: CustomExercisePayload) => void;
}) {
  const hits = gym?.hits ?? [];
  const avg = averageIntensity(hits);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <DayPicker today={today} date={date} onChange={onDateChange} />
        <div className={`${CARD_CLS} grid grid-cols-4 divide-x divide-line py-3`}>
          <DayStat label="Muscles" value={String(hits.length)} />
          <DayStat
            label="Avg"
            value={hits.length === 0 ? "—" : String(avg)}
            accent={hits.length > 0}
          />
          <DayStat label="Sports" value={String(sports.length)} />
          <DayStat label="Supps" value={String(supplements.length)} />
        </div>
      </div>

      <div>
        <h2 className={`mb-3 ${LABEL_CLS}`}>Gym</h2>
        <GymBar
          date={date}
          session={gym}
          muscles={muscles}
          onChange={onGymChange}
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

      {recentSessions.length > 0 ? (
        <div>
          <h2 className={`mb-3 ${LABEL_CLS}`}>Recent gym days</h2>
          <div className="space-y-2">
            {recentSessions.slice(0, 4).map((item) => (
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
                  {formatGymSummary(item.hits) || `${item.hitCount} muscles`}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <PrBar
        date={date}
        exercises={customExercises}
        onChange={onExerciseChange}
      />
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
