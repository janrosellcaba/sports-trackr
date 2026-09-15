"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { deleteWorkout } from "@/app/actions/gym";
import { deleteSport } from "@/app/actions/sports";
import { deleteSupplement } from "@/app/actions/supplements";
import { WorkoutEditor } from "@/components/gym/WorkoutEditor";
import { SportsBar } from "@/components/sports/SportsBar";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { formatDisplayDate, getTodayLocalDateISO } from "@/lib/calculations";
import { formatSportSummary, sportLabel } from "@/lib/sports";
import { CARD_CLS, INPUT_CLS, LABEL_CLS, PRIMARY_BTN } from "@/lib/ui";
import type {
  CustomExercisePayload,
  SportSessionPayload,
  SupplementPayload,
  WorkoutPayload,
} from "@/types/trackr";

type Filter = "all" | "gym" | "sports" | "supplements";

type FeedItem =
  | { kind: "workout"; at: string; data: WorkoutPayload }
  | { kind: "sport"; at: string; data: SportSessionPayload }
  | { kind: "supplement"; at: string; data: SupplementPayload };

const KIND_ORDER = { workout: 0, sport: 1, supplement: 2 } as const;

export function LogView({
  today,
  workouts,
  sports,
  supplements,
  customExercises,
  onWorkoutChange,
  onSportLogged,
  onDeleteWorkout,
  onDeleteSport,
  onDeleteSupplement,
}: {
  today: string;
  workouts: WorkoutPayload[];
  sports: SportSessionPayload[];
  supplements: SupplementPayload[];
  customExercises: CustomExercisePayload[];
  onWorkoutChange: (workout: WorkoutPayload) => void;
  onSportLogged: (session: SportSessionPayload) => void;
  onDeleteWorkout: (id: string) => void;
  onDeleteSport: (id: string) => void;
  onDeleteSupplement: (id: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pastOpen, setPastOpen] = useState(false);
  const [pastDate, setPastDate] = useState(today);
  const [isPending, startTransition] = useTransition();

  const items = useMemo<FeedItem[]>(() => {
    const merged: FeedItem[] = [
      ...workouts.map((data) => ({
        kind: "workout" as const,
        at: data.date,
        data,
      })),
      ...sports.map((data) => ({
        kind: "sport" as const,
        at: data.date,
        data,
      })),
      ...supplements.map((data) => ({
        kind: "supplement" as const,
        at: data.date,
        data,
      })),
    ];
    return merged.sort((a, b) => {
      if (a.at !== b.at) return b.at.localeCompare(a.at);
      return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
    });
  }, [workouts, sports, supplements]);

  const visible = items.filter((item) => {
    if (filter === "gym") return item.kind === "workout";
    if (filter === "sports") return item.kind === "sport";
    if (filter === "supplements") return item.kind === "supplement";
    return true;
  });

  const pastWorkout =
    workouts.find((workout) => workout.date === pastDate) ??
    (pastDate === today
      ? null
      : {
          id: `draft-${pastDate}`,
          date: pastDate,
          notes: null,
          exercises: [],
          totalVolumeKg: 0,
          setCount: 0,
        });

  const pastSports = sports.filter((session) => session.date === pastDate);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={LABEL_CLS}>History</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Log</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setPastDate(today);
            setPastOpen(true);
          }}
          className="rounded-xl bg-chip px-3 py-2 text-sm font-bold text-ink hover:bg-chip-hover"
        >
          Other day
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1 rounded-xl bg-chip/80 p-1">
        {(
          [
            ["all", "All"],
            ["gym", "Gym"],
            ["sports", "Sport"],
            ["supplements", "Supps"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-lg py-2 text-xs font-bold transition-all duration-150 ${
              filter === key ? "bg-paper text-ink shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <section className={`${CARD_CLS} border-dashed px-4 py-10 text-center`}>
          <p className="text-sm text-muted">
            Nothing here yet. Log gym, a sport, or a supplement on Home.
          </p>
        </section>
      ) : (
        <section className="space-y-3">
          {visible.map((item) => {
            if (item.kind === "workout") {
              const workout = item.data;
              const open = openId === workout.id;
              return (
                <article key={`w-${workout.id}`} className={`${CARD_CLS} overflow-hidden`}>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : workout.id)}
                    className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand">
                          Gym
                        </span>
                        <span className="text-xs text-muted">
                          {formatDisplayDate(workout.date)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-bold text-ink">
                        {workout.exercises.length} exercises · {workout.setCount}{" "}
                        sets · {workout.totalVolumeKg.toLocaleString()}kg
                      </p>
                    </div>
                    <ChevronDown
                      className={`mt-1 h-4 w-4 shrink-0 text-muted transition ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {open ? (
                    <div className="space-y-3 border-t border-line px-4 py-3">
                      <WorkoutEditor
                        date={workout.date}
                        workout={workout}
                        customExercises={customExercises}
                        onChange={(next) => {
                          if (next) onWorkoutChange(next);
                        }}
                      />
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          if (!window.confirm("Delete this gym day?")) return;
                          startTransition(async () => {
                            await deleteWorkout(workout.id);
                            onDeleteWorkout(workout.id);
                            setOpenId(null);
                          });
                        }}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-danger-soft px-3 text-xs font-bold text-danger hover:bg-danger/15 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete day
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            }

            if (item.kind === "sport") {
              const session = item.data;
              const summary = formatSportSummary(session);
              return (
                <article
                  key={`sp-${session.id}`}
                  className={`${CARD_CLS} flex items-start justify-between gap-3 px-4 py-3.5`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-bold text-ink">
                        Sport
                      </span>
                      <span className="text-xs text-muted">
                        {formatDisplayDate(session.date)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-bold text-ink">
                      {sportLabel(session.type)}
                      {summary ? ` · ${summary}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      startTransition(async () => {
                        await deleteSport(session.id);
                        onDeleteSport(session.id);
                      });
                    }}
                    className="rounded-md px-2 py-1 text-xs font-semibold text-muted hover:text-danger disabled:opacity-50"
                  >
                    Del
                  </button>
                </article>
              );
            }

            const intake = item.data;
            return (
              <article
                key={`s-${intake.id}`}
                className={`${CARD_CLS} flex items-start justify-between gap-3 px-4 py-3.5`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-bold text-ink">
                      Supplement
                    </span>
                    <span className="text-xs text-muted">
                      {formatDisplayDate(intake.date)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-ink">
                    {intake.name} · {intake.dose}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    startTransition(async () => {
                      await deleteSupplement(intake.id);
                      onDeleteSupplement(intake.id);
                    });
                  }}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-muted hover:text-danger disabled:opacity-50"
                >
                  Del
                </button>
              </article>
            );
          })}
        </section>
      )}

      {pastOpen ? (
        <BottomSheet title="Log another day" onClose={() => setPastOpen(false)}>
          <label className="mb-4 block">
            <span className="mb-1 block text-sm font-semibold text-ink">Date</span>
            <input
              type="date"
              max={getTodayLocalDateISO()}
              value={pastDate}
              onChange={(event) => setPastDate(event.target.value)}
              className={INPUT_CLS}
            />
          </label>
          <div className="space-y-4">
            <SportsBar
              date={pastDate}
              sessions={pastSports}
              onLogged={onSportLogged}
              onRemoved={onDeleteSport}
            />
            <WorkoutEditor
              date={pastDate}
              workout={
                pastWorkout && pastWorkout.id.startsWith("draft-")
                  ? null
                  : pastWorkout
              }
              customExercises={customExercises}
              onChange={(workout) => {
                if (workout) onWorkoutChange(workout);
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => setPastOpen(false)}
            className={`${PRIMARY_BTN} mt-4 w-full bg-brand hover:bg-brand-dark`}
          >
            Done
          </button>
        </BottomSheet>
      ) : null}
    </div>
  );
}
