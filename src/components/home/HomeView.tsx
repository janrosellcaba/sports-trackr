"use client";

import { useRouter } from "next/navigation";
import { formatDisplayDate } from "@/lib/calculations";
import { averageIntensity, formatGymSummary } from "@/lib/muscles";
import { CARD_CLS, LABEL_CLS, PAGE_TITLE } from "@/lib/ui";
import { GymBar } from "@/components/gym/GymBar";
import { PrBar } from "@/components/gym/PrBar";
import { SportsBar } from "@/components/sports/SportsBar";
import { SupplementBar } from "@/components/supplements/SupplementBar";
import { DayPicker } from "@/components/ui/DayPicker";
import { useLatestProps } from "@/lib/use-latest-props";
import type {
  CustomExercisePayload,
  CustomSupplementPayload,
  GymSessionPayload,
  MusclePayload,
  MuscleRecoveryPayload,
  SportSessionPayload,
  SupplementPayload,
} from "@/types/trackr";

export function HomeView({
  today,
  date,
  gym,
  sports,
  supplements,
  recentSessions,
  recovery,
  muscles,
  customExercises,
  customSupplements,
}: {
  today: string;
  date: string;
  gym: GymSessionPayload | null;
  sports: SportSessionPayload[];
  supplements: SupplementPayload[];
  recentSessions: GymSessionPayload[];
  recovery: MuscleRecoveryPayload[];
  muscles: MusclePayload[];
  customExercises: CustomExercisePayload[];
  customSupplements: CustomSupplementPayload[];
}) {
  const router = useRouter();
  const [dayGym, setDayGym] = useLatestProps(gym);
  const [daySports, setDaySports] = useLatestProps(sports);
  const [daySupplements, setDaySupplements] = useLatestProps(supplements);
  const [exercises, setExercises] = useLatestProps(customExercises);
  const hits = dayGym?.hits ?? [];
  const avg = averageIntensity(hits);

  function goToDate(next: string) {
    router.push(next === today ? "/" : `/?date=${next}`);
  }

  return (
    <div className="space-y-6">
      <h1 className={PAGE_TITLE}>
        {date === today ? "Today" : formatDisplayDate(date)}
      </h1>
      <div className="space-y-3">
        <DayPicker today={today} date={date} onChange={goToDate} />
        <div className={`${CARD_CLS} grid grid-cols-2 gap-px bg-line sm:grid-cols-4`}>
          <DayStat label="Muscles" value={String(hits.length)} />
          <DayStat
            label="Avg intensity"
            value={hits.length === 0 ? "—" : `${avg} / 5`}
            accent={hits.length > 0}
          />
          <DayStat label="Sports" value={String(daySports.length)} />
          <DayStat label="Supplements" value={String(daySupplements.length)} />
        </div>
      </div>

      <div>
        <h2 className={`mb-3 ${LABEL_CLS}`}>Gym</h2>
        <GymBar
          date={date}
          session={dayGym}
          muscles={muscles}
          recovery={recovery}
          onChange={(session) => {
            setDayGym(session);
            router.refresh();
          }}
        />
      </div>

      <SupplementBar
        date={date}
        intakes={daySupplements}
        customSupplements={customSupplements}
        onChange={(intakes) => {
          setDaySupplements(intakes);
          router.refresh();
        }}
      />

      <SportsBar
        date={date}
        sessions={daySports}
        lockDate
        onLogged={(session) => {
          setDaySports((current) => {
            const next = [
              session,
              ...current.filter((item) => item.id !== session.id),
            ];
            return next.sort((a, b) => b.date.localeCompare(a.date));
          });
          router.refresh();
        }}
        onRemoved={(id) => {
          setDaySports((current) => current.filter((item) => item.id !== id));
          router.refresh();
        }}
      />

      {recentSessions.length > 0 ? (
        <div>
          <h2 className={`mb-3 ${LABEL_CLS}`}>Other gym days</h2>
          <div className="space-y-2">
            {recentSessions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goToDate(item.date)}
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
        exercises={exercises}
        lockDate
        onChange={(row) => {
          setExercises((current) =>
            [row, ...current.filter((item) => item.id !== row.id)].sort((a, b) =>
              a.name.localeCompare(b.name),
            ),
          );
          router.refresh();
        }}
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
    <div className="min-w-0 bg-paper px-3 py-3 text-center">
      <p
        className={`truncate text-lg font-semibold tabular-nums ${
          accent ? "text-brand-text" : "text-ink"
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-muted">{label}</p>
    </div>
  );
}
