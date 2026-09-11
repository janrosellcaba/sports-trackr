"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { deleteWorkoutSession } from "@/app/actions/analytics";
import type { CardioHistoryItem, WorkoutHistoryItem } from "@/types/trackr";
import { deleteCardioActivity } from "@/app/actions/activities";

type HistoryFeedProps = {
  sessions: WorkoutHistoryItem[];
  activities: CardioHistoryItem[];
};

type FeedItem =
  | { kind: "session"; at: number; data: WorkoutHistoryItem }
  | { kind: "cardio"; at: number; data: CardioHistoryItem };

const CARDIO_LABELS: Record<string, string> = {
  RUNNING: "Running",
  CYCLING: "Cycling",
  SWIMMING: "Swimming",
  PADEL: "Padel",
  TENNIS: "Tennis",
};

export function HistoryFeed({ sessions, activities }: HistoryFeedProps) {
  const [isPending, startTransition] = useTransition();
  const [openId, setOpenId] = useState<string | null>(null);

  const items = useMemo<FeedItem[]>(() => {
    const merged: FeedItem[] = [
      ...sessions.map((data) => ({
        kind: "session" as const,
        at: new Date(data.startTime).getTime(),
        data,
      })),
      ...activities.map((data) => ({
        kind: "cardio" as const,
        at: new Date(data.date).getTime(),
        data,
      })),
    ];
    return merged.sort((a, b) => b.at - a.at);
  }, [sessions, activities]);

  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 px-4 py-10 text-center">
        <p className="text-sm text-neutral-400">
          No completed workouts or sports yet. Finish a gym session or log
          cardio to build history.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      {items.map((item) => {
        if (item.kind === "session") {
          const session = item.data;
          const open = openId === session.id;

          return (
            <article
              key={`session-${session.id}`}
              className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/50"
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : session.id)}
                className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-lime-400/30 bg-lime-400/10 px-2 py-0.5 text-[11px] font-medium text-lime-300">
                      Gym
                    </span>
                    <span className="text-xs text-neutral-500">
                      {formatDateTime(session.startTime)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-neutral-100">
                    {session.durationMinutes}m · {session.exerciseCount}{" "}
                    exercises · {session.totalVolumeKg.toLocaleString()}kg
                  </p>
                  {session.notes && (
                    <p className="mt-1 truncate text-xs text-neutral-500">
                      {session.notes}
                    </p>
                  )}
                </div>
                <ChevronDown
                  className={`mt-1 h-4 w-4 shrink-0 text-neutral-500 transition ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </button>

              {open && (
                <div className="space-y-3 border-t border-neutral-800 px-4 py-3">
                  {session.exercises.map((exercise) => (
                    <div key={exercise.id}>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-neutral-200">
                          {exercise.machineName}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {exercise.volumeKg}kg vol
                        </p>
                      </div>
                      <ul className="space-y-1">
                        {exercise.sets.map((set) => (
                          <li
                            key={set.id}
                            className="flex justify-between font-mono text-xs text-neutral-400"
                          >
                            <span>Set {set.setNumber}</span>
                            <span>
                              {set.weight}kg × {set.reps}
                              {set.rpe != null ? ` @ ${set.rpe}` : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  <div className="flex items-center justify-between gap-3 border-t border-neutral-800 pt-3">
                    <p className="text-xs text-neutral-500">
                      Ended {formatDateTime(session.endTime)}
                    </p>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        const confirmed = window.confirm(
                          "Delete this gym session permanently?",
                        );
                        if (!confirmed) return;
                        startTransition(async () => {
                          await deleteWorkoutSession(session.id);
                        });
                      }}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-800 px-3 text-xs text-neutral-400 hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        }

        const activity = item.data;
        return (
          <article
            key={`cardio-${activity.id}`}
            className="flex items-start justify-between gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/50 px-4 py-3.5"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                  Sport
                </span>
                <span className="text-xs text-neutral-500">
                  {formatDateTime(activity.date)}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-neutral-100">
                {CARDIO_LABELS[activity.type] ?? activity.type} ·{" "}
                {activity.durationMinutes}m · {activity.intensity.toLowerCase()}
              </p>
              {activity.notes && (
                <p className="mt-1 truncate text-xs text-neutral-500">
                  {activity.notes}
                </p>
              )}
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await deleteCardioActivity(activity.id);
                });
              }}
              className="rounded-md px-2 py-1 text-xs text-neutral-500 hover:text-red-400 disabled:opacity-50"
            >
              Del
            </button>
          </article>
        );
      })}
    </section>
  );
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
