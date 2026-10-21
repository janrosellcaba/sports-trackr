"use client";

import { useRouter } from "next/navigation";
import { formatDisplayDate } from "@/lib/calculations";
import { formatLift } from "@/lib/catalog";
import { averageIntensity } from "@/lib/muscles";
import { shapeWeekLabel } from "@/lib/shape";
import { sportLabel, type SportDefinition } from "@/lib/sports";
import { CARD_CLS, LABEL_CLS, PAGE_TITLE } from "@/lib/ui";
import { useUnits } from "@/components/units/UnitsProvider";
import { GymBar } from "@/components/gym/GymBar";
import { PrBar } from "@/components/gym/PrBar";
import { SectionFold } from "@/components/home/SectionFold";
import { WeekStrip } from "@/components/home/WeekStrip";
import { SportsBar } from "@/components/sports/SportsBar";
import { SupplementBar } from "@/components/supplements/SupplementBar";
import { BodyWeightBar } from "@/components/weight/BodyWeightBar";
import { DayPicker } from "@/components/ui/DayPicker";
import { useLatestProps } from "@/lib/use-latest-props";
import type { WeekDayCell } from "@/lib/analytics";
import type {
  BodyWeightPayload,
  CustomExercisePayload,
  GymSessionPayload,
  MusclePayload,
  MuscleRecoveryPayload,
  SportCatalogPayload,
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
  sportCatalog,
  shape,
  week,
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
  sportCatalog: SportCatalogPayload[];
  shape: { score: number; weekChange: number | null } | null;
  week: WeekDayCell[];
}) {
  const router = useRouter();
  const { massUnit } = useUnits();
  const [dayGym, setDayGym] = useLatestProps(gym);
  const [daySports, setDaySports] = useLatestProps(sports);
  const [dayWeight, setDayWeight] = useLatestProps(weight);
  const [daySupplements, setDaySupplements] = useLatestProps(supplements);
  const [exercises, setExercises] = useLatestProps(customExercises);
  const hits = dayGym?.hits ?? [];
  const avg = averageIntensity(hits);
  const catalog = sportCatalog.map(
    (item): SportDefinition => ({
      id: item.nameKey,
      label: item.name,
      fields: item.fields,
    }),
  );
  const gymSummary = hits
    .slice()
    .sort((a, b) => b.intensity - a.intensity || a.muscleName.localeCompare(b.muscleName))
    .map((hit) => `${hit.muscleName} ${hit.intensity}`)
    .join(" · ");
  const sportSummary = daySports
    .map((session) => catalog.find((item) => item.id === session.type)?.label ?? sportLabel(session.type))
    .join(" · ");
  const records = exercises.filter((item) => item.prWeight != null);
  const todayRecords = records.filter((item) => item.prDate === date);
  const prSummary = (todayRecords.length > 0 ? todayRecords : records)
    .slice(0, 3)
    .map((item) => `${item.name} ${formatLift(item.prWeight, item.prReps, massUnit, item.dualWeights)}`)
    .join(" · ");

  function goToDate(next: string) {
    router.push(next === today ? "/" : `/?date=${next}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <h1 className={PAGE_TITLE}>
          {date === today ? "Today" : formatDisplayDate(date)}
        </h1>
        {shape ? (
          <p className="pb-0.5 text-right">
            <span className={LABEL_CLS}>Shape</span>
            <span className="mt-1 block font-display text-2xl leading-none font-bold tabular-nums text-ink">
              {shape.score}
            </span>
            <span className="mt-1 block text-[11px] font-semibold text-muted">
              {shapeWeekLabel(shape.weekChange)}
            </span>
          </p>
        ) : null}
      </div>
      <div className="space-y-3">
        <DayPicker today={today} date={date} onChange={goToDate} />
        <WeekStrip days={week} selected={date} onSelect={goToDate} />
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

      <SectionFold
        label="Gym"
        summary={gymSummary || dayGym?.notes || "Logged"}
        filled={hits.length > 0 || Boolean(dayGym?.notes)}
      >
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
      </SectionFold>

      <SectionFold
        label="Supplements"
        summary={daySupplements.map((item) => item.name).join(" · ")}
        filled={daySupplements.length > 0}
      >
        <SupplementBar
          date={date}
          intakes={daySupplements}
          onChange={(intakes) => {
            setDaySupplements(intakes);
            router.refresh();
          }}
        />
      </SectionFold>

      <SectionFold label="Sports" summary={sportSummary} filled={daySports.length > 0}>
        <SportsBar
          date={date}
          sessions={daySports}
          catalog={catalog}
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
      </SectionFold>

      <SectionFold
        label="Body weight"
        summary={
          dayWeight
            ? formatLift(dayWeight.weightKg, null, massUnit)
            : ""
        }
        filled={dayWeight != null}
      >
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
      </SectionFold>

      <SectionFold label="PRs" summary={prSummary} filled={records.length > 0}>
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
      </SectionFold>
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
        className={`truncate font-display text-xl font-bold tabular-nums ${
          accent ? "text-brand-text" : "text-ink"
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[10px] font-semibold tracking-[0.18em] text-muted uppercase">
        {label}
      </p>
    </div>
  );
}
