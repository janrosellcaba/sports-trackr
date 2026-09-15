"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { deleteWorkout } from "@/app/actions/gym";
import { deleteSport } from "@/app/actions/sports";
import { deleteSupplement, updateSupplement } from "@/app/actions/supplements";
import { WorkoutEditor } from "@/components/gym/WorkoutEditor";
import { SportFormSheet } from "@/components/sports/SportsBar";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { DateField } from "@/components/ui/DayPicker";
import { formatDisplayDate } from "@/lib/calculations";
import { formatSportSummary, sportDefinition, sportLabel } from "@/lib/sports";
import { CARD_CLS, INPUT_CLS, LABEL_CLS, PAGE_TITLE, PRIMARY_BTN } from "@/lib/ui";
import type {
  CustomExercisePayload,
  SportSessionPayload,
  SupplementPayload,
  WorkoutPayload,
} from "@/types/trackr";

type Filter = "all" | "gym" | "sports" | "supplements";

type DayGroup = {
  date: string;
  workout: WorkoutPayload | null;
  sports: SportSessionPayload[];
  supplements: SupplementPayload[];
};

export function LogView({
  today,
  workouts,
  sports,
  supplements,
  customExercises,
  onWorkoutChange,
  onSportLogged,
  onSupplementUpsert,
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
  onSupplementUpsert: (intake: SupplementPayload) => void;
  onDeleteWorkout: (id: string) => void;
  onDeleteSport: (id: string) => void;
  onDeleteSupplement: (id: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [editingSport, setEditingSport] = useState<SportSessionPayload | null>(null);
  const [editingSupplement, setEditingSupplement] = useState<SupplementPayload | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const days = useMemo(() => {
    const map = new Map<string, DayGroup>();

    function group(date: string): DayGroup {
      const existing = map.get(date);
      if (existing) return existing;
      const created: DayGroup = {
        date,
        workout: null,
        sports: [],
        supplements: [],
      };
      map.set(date, created);
      return created;
    }

    for (const workout of workouts) {
      group(workout.date).workout = workout;
    }
    for (const session of sports) {
      group(session.date).sports.push(session);
    }
    for (const intake of supplements) {
      group(intake.date).supplements.push(intake);
    }

    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [workouts, sports, supplements]);

  const visible = days.filter((day) => {
    if (filter === "gym") return day.workout != null;
    if (filter === "sports") return day.sports.length > 0;
    if (filter === "supplements") return day.supplements.length > 0;
    return true;
  });

  const editingSportDef = editingSport ? sportDefinition(editingSport.type) : null;

  return (
    <div className="space-y-4">
      <h1 className={PAGE_TITLE}>Log</h1>

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
          {visible.map((day) => {
            const open = openDate === day.date;
            const gymLine = day.workout
              ? `${day.workout.exercises.length} exercise${
                  day.workout.exercises.length === 1 ? "" : "s"
                } · ${day.workout.setCount} sets · ${day.workout.totalVolumeKg.toLocaleString()}kg`
              : null;

            return (
              <article key={day.date} className={`${CARD_CLS} overflow-hidden`}>
                <button
                  type="button"
                  onClick={() => setOpenDate(open ? null : day.date)}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      {formatDisplayDate(day.date)}
                      {day.date === today ? (
                        <span className="ml-2 text-xs font-bold text-brand">Today</span>
                      ) : null}
                    </p>
                    <div className="mt-2 space-y-1">
                      {day.workout ? (
                        <p className="text-sm font-bold text-ink">
                          Gym · {gymLine}
                        </p>
                      ) : null}
                      {day.sports.map((session) => {
                        const summary = formatSportSummary(session);
                        return (
                          <p key={session.id} className="text-sm text-ink">
                            {sportLabel(session.type)}
                            {summary ? ` · ${summary}` : ""}
                          </p>
                        );
                      })}
                      {day.supplements.length > 0 ? (
                        <p className="text-sm text-muted">
                          {day.supplements.map((item) => item.name).join(" · ")}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <ChevronDown
                    className={`mt-1 h-4 w-4 shrink-0 text-muted transition ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {open ? (
                  <div className="space-y-5 border-t border-line px-4 py-4">
                    {(filter === "all" || filter === "gym") && (
                      <section className="space-y-2">
                        <p className={LABEL_CLS}>Gym workout</p>
                        <p className="text-xs text-muted">
                          Every exercise this day is one workout.
                        </p>
                        <WorkoutEditor
                          date={day.date}
                          workout={day.workout}
                          customExercises={customExercises}
                          onChange={(next) => {
                            if (next) onWorkoutChange(next);
                          }}
                        />
                        {day.workout ? (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => {
                              if (!window.confirm("Delete this gym workout?")) return;
                              startTransition(async () => {
                                await deleteWorkout(day.workout!.id);
                                onDeleteWorkout(day.workout!.id);
                              });
                            }}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-danger-soft px-3 text-xs font-bold text-danger hover:bg-danger/15 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete gym
                          </button>
                        ) : null}
                      </section>
                    )}

                    {(filter === "all" || filter === "sports") && (
                      <section className="space-y-2">
                        <p className={LABEL_CLS}>Sports</p>
                        {day.sports.length === 0 ? (
                          <p className="text-sm text-muted">No sports this day.</p>
                        ) : (
                          <ul className="space-y-2">
                            {day.sports.map((session) => {
                              const summary = formatSportSummary(session);
                              return (
                                <li
                                  key={session.id}
                                  className="rounded-xl bg-chip px-3 py-2.5"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold text-ink">
                                        {sportLabel(session.type)}
                                        {summary ? ` · ${summary}` : ""}
                                      </p>
                                      {session.notes ? (
                                        <p className="mt-0.5 text-xs text-muted">
                                          {session.notes}
                                        </p>
                                      ) : null}
                                    </div>
                                    <span className="flex shrink-0 gap-2">
                                      <button
                                        type="button"
                                        className="text-xs font-bold text-muted"
                                        onClick={() => setEditingSport(session)}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isPending}
                                        className="text-xs font-bold text-danger disabled:opacity-50"
                                        onClick={() => {
                                          startTransition(async () => {
                                            await deleteSport(session.id);
                                            onDeleteSport(session.id);
                                          });
                                        }}
                                      >
                                        Del
                                      </button>
                                    </span>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </section>
                    )}

                    {(filter === "all" || filter === "supplements") && (
                      <section className="space-y-2">
                        <p className={LABEL_CLS}>Supplements</p>
                        {day.supplements.length === 0 ? (
                          <p className="text-sm text-muted">No supplements this day.</p>
                        ) : (
                          <ul className="space-y-2">
                            {day.supplements.map((intake) => (
                              <li
                                key={intake.id}
                                className="flex items-center justify-between gap-2 rounded-xl bg-chip px-3 py-2.5"
                              >
                                <p className="min-w-0 text-sm font-bold text-ink">
                                  {intake.name} · {intake.dose}
                                </p>
                                <span className="flex shrink-0 gap-2">
                                  <button
                                    type="button"
                                    className="text-xs font-bold text-muted"
                                    onClick={() => setEditingSupplement(intake)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isPending}
                                    className="text-xs font-bold text-danger disabled:opacity-50"
                                    onClick={() => {
                                      startTransition(async () => {
                                        await deleteSupplement(intake.id);
                                        onDeleteSupplement(intake.id);
                                      });
                                    }}
                                  >
                                    Del
                                  </button>
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      )}

      {editingSport && editingSportDef ? (
        <SportFormSheet
          date={editingSport.date}
          sport={editingSportDef}
          initial={editingSport}
          onClose={() => setEditingSport(null)}
          onSave={(session) => {
            onSportLogged(session);
            setEditingSport(null);
          }}
        />
      ) : null}

      {editingSupplement ? (
        <SupplementEditSheet
          initial={editingSupplement}
          onClose={() => setEditingSupplement(null)}
          onSave={(intake) => {
            onSupplementUpsert(intake);
            setEditingSupplement(null);
          }}
        />
      ) : null}
    </div>
  );
}

function SupplementEditSheet({
  initial,
  onClose,
  onSave,
}: {
  initial: SupplementPayload;
  onClose: () => void;
  onSave: (intake: SupplementPayload) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [dose, setDose] = useState(initial.dose);
  const [date, setDate] = useState(initial.date);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <BottomSheet title="Edit supplement" onClose={onClose}>
      <DateField value={date} onChange={setDate} />
      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-semibold text-ink">Name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={INPUT_CLS}
        />
      </label>
      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-semibold text-ink">Dose</span>
        <input
          value={dose}
          onChange={(event) => setDose(event.target.value)}
          className={INPUT_CLS}
        />
      </label>
      {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}
      <button
        type="button"
        disabled={pending}
        className={`${PRIMARY_BTN} w-full bg-brand hover:bg-brand-dark`}
        onClick={() => {
          startTransition(async () => {
            try {
              const row = await updateSupplement({
                id: initial.id,
                name,
                dose,
                date,
              });
              onSave(row);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not save.");
            }
          });
        }}
      >
        Save
      </button>
    </BottomSheet>
  );
}
