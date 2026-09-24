"use client";

import { useRouter } from "next/navigation";
import { formatDisplayDate } from "@/lib/calculations";
import { averageIntensity } from "@/lib/muscles";
import { CARD_CLS, PAGE_TITLE } from "@/lib/ui";
import { GymBar } from "@/components/gym/GymBar";
import { PrBar } from "@/components/gym/PrBar";
import { SportsBar } from "@/components/sports/SportsBar";
import { SupplementBar } from "@/components/supplements/SupplementBar";
import { BodyWeightBar } from "@/components/weight/BodyWeightBar";
import { DayPicker } from "@/components/ui/DayPicker";
import { useLatestProps } from "@/lib/use-latest-props";
import type {
  BodyWeightPayload,
  CustomExercisePayload,
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
  weight,
  supplements,
  recovery,
  muscles,
  customExercises,
}: {
  today: string;
  date: string;
  gym: GymSessionPayload | null;
  sports: SportSessionPayload[];
  weight: BodyWeightPayload | null;
  supplements: SupplementPayload[];
  recovery: MuscleRecoveryPayload[];
  muscles: MusclePayload[];
  customExercises: CustomExercisePayload[];
}) {
  const router = useRouter();
  const [dayGym, setDayGym] = useLatestProps(gym);
  const [daySports, setDaySports] = useLatestProps(sports);
  const [dayWeight, setDayWeight] = useLatestProps(weight);
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
        <div className={`${CARD_CLS} grid grid-cols-2 gap-px overflow-hidden bg-line sm:grid-cols-4`}>
          <DayStat label="Muscles" value={String(hits.length)} />
          <DayStat
            label="Intensity"
            value={hits.length === 0 ? "—" : `${avg}/5`}
            accent={hits.length > 0}
          />
          <DayStat label="Sports" value={String(daySports.length)} />
          <DayStat label="Supps" value={String(daySupplements.length)} />
        </div>
      </div>

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

      <SupplementBar
        date={date}
        intakes={daySupplements}
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

      <BodyWeightBar
        date={date}
        entry={dayWeight}
        onChange={(entry) => {
          setDayWeight(entry);
          router.refresh();
        }}
        onRemoved={() => {
          setDayWeight(null);
          router.refresh();
        }}
      />

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
    <div className="min-w-0 bg-paper/90 px-3 py-3.5 text-center">
      <p
        className={`truncate font-display text-xl font-extrabold tabular-nums ${
          accent ? "text-brand-text" : "text-ink"
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
        {label}
      </p>
    </div>
  );
}
