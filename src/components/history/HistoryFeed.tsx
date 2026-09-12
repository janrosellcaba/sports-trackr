"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDown, Trash2 } from "lucide-react";
import type { CardioHistoryItem, WorkoutHistoryItem } from "@/types/trackr";
import { runMutation } from "@/lib/offline/mutate";
import { CARD_CLS } from "@/lib/ui";

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
  const [hidden, setHidden] = useState<Set<string>>(new Set());

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
    return merged
      .filter((item) => !hidden.has(item.data.id))
      .sort((a, b) => b.at - a.at);
  }, [sessions, activities, hidden]);

  if (items.length === 0) {
    return (
      <section className={`${CARD_CLS} border-dashed px-4 py-10 text-center`}>
        <p className="text-sm text-muted">
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
              className={`${CARD_CLS} overflow-hidden`}
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : session.id)}
                className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand">
                      Gym
                    </span>
                    <span className="text-xs text-muted">
                      {formatDateTime(session.startTime)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-ink">
                    {session.durationMinutes}m · {session.exerciseCount}{" "}
                    exercises · {session.totalVolumeKg.toLocaleString()}kg
                  </p>
                  {session.notes && (
                    <p className="mt-1 truncate text-xs text-muted">
                      {session.notes}
                    </p>
                  )}
                </div>
                <ChevronDown
                  className={`mt-1 h-4 w-4 shrink-0 text-muted transition ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </button>

              {open && (
                <div className="space-y-3 border-t border-line px-4 py-3">
                  {session.exercises.map((exercise) => (
                    <div key={exercise.id}>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-ink">
                          {exercise.machineName}
                        </p>
                        <p className="text-xs text-muted">
                          {exercise.volumeKg}kg vol
                        </p>
                      </div>
                      <ul className="space-y-1">
                        {exercise.sets.map((set) => (
                          <li
                            key={set.id}
                            className="flex justify-between font-mono text-xs text-muted"
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

                  <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
                    <div>
                      <p className="text-xs text-muted">
                        Ended {formatDateTime(session.endTime)}
                      </p>
                      <Link
                        href={`/?session=${session.id}`}
                        className="text-xs font-bold text-brand"
                      >
                        Continue logging
                      </Link>
                    </div>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        const confirmed = window.confirm(
                          "Delete this gym session permanently?",
                        );
                        if (!confirmed) return;
                        startTransition(async () => {
                          await runMutation(
                            "deleteSession",
                            { id: session.id },
                            undefined,
                          );
                          setHidden((current) => new Set(current).add(session.id));
                        });
                      }}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-danger-soft px-3 text-xs font-bold text-danger hover:bg-danger/15 disabled:opacity-50"
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
            className={`${CARD_CLS} flex items-start justify-between gap-3 px-4 py-3.5`}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-bold text-ink">
                  Sport
                </span>
                <span className="text-xs text-muted">
                  {formatDateTime(activity.date)}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-bold text-ink">
                {CARDIO_LABELS[activity.type] ?? activity.type} ·{" "}
                {activity.durationMinutes}m · {activity.intensity.toLowerCase()}
              </p>
              {activity.notes && (
                <p className="mt-1 truncate text-xs text-muted">
                  {activity.notes}
                </p>
              )}
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await runMutation("deleteCardio", { id: activity.id }, undefined);
                  setHidden((current) => new Set(current).add(activity.id));
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
