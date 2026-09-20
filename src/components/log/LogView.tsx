"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Trash2 } from "lucide-react";
import { deleteGymSession } from "@/app/actions/gym";
import { deleteSport } from "@/app/actions/sports";
import { deleteSupplement } from "@/app/actions/supplements";
import { GymBar } from "@/components/gym/GymBar";
import { SportFormSheet } from "@/components/sports/SportsBar";
import { SupplementFormSheet } from "@/components/supplements/SupplementBar";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { formatDisplayDate } from "@/lib/calculations";
import { useLatestProps } from "@/lib/use-latest-props";
import { formatGymSummary } from "@/lib/muscles";
import { formatSportSummary, sportDefinition, sportLabel } from "@/lib/sports";
import { supplementFromName } from "@/lib/supplements";
import { useUnits } from "@/components/units/UnitsProvider";
import {
  CARD_CLS,
  DANGER_BTN,
  GHOST_BTN,
  LABEL_CLS,
  PAGE_TITLE,
} from "@/lib/ui";
import type {
  GymSessionPayload,
  MusclePayload,
  SportSessionPayload,
  SupplementPayload,
} from "@/types/trackr";

type Filter = "all" | "gym" | "sports" | "supplements";

type DayGroup = {
  date: string;
  gym: GymSessionPayload | null;
  sports: SportSessionPayload[];
  supplements: SupplementPayload[];
};

export function LogView({
  today,
  gymSessions,
  sports,
  supplements,
  muscles,
}: {
  today: string;
  gymSessions: GymSessionPayload[];
  sports: SportSessionPayload[];
  supplements: SupplementPayload[];
  muscles: MusclePayload[];
}) {
  const router = useRouter();
  const { distanceUnit } = useUnits();
  const [filter, setFilter] = useState<Filter>("all");
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [editingSport, setEditingSport] = useState<SportSessionPayload | null>(null);
  const [editingSupplement, setEditingSupplement] = useState<SupplementPayload | null>(
    null,
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    body: string;
    run: () => Promise<void>;
  } | null>(null);
  const [, startTransition] = useTransition();
  const [gym, setGym] = useLatestProps(gymSessions);
  const [sportRows, setSportRows] = useLatestProps(sports);
  const [suppRows, setSuppRows] = useLatestProps(supplements);

  const days = useMemo(() => {
    const map = new Map<string, DayGroup>();
    function group(date: string): DayGroup {
      const existing = map.get(date);
      if (existing) return existing;
      const created: DayGroup = { date, gym: null, sports: [], supplements: [] };
      map.set(date, created);
      return created;
    }
    for (const session of gym) group(session.date).gym = session;
    for (const session of sportRows) group(session.date).sports.push(session);
    for (const intake of suppRows) group(intake.date).supplements.push(intake);
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [gym, sportRows, suppRows]);

  const visible = days.filter((day) => {
    if (filter === "gym") return day.gym != null;
    if (filter === "sports") return day.sports.length > 0;
    if (filter === "supplements") return day.supplements.length > 0;
    return true;
  });

  const editingSportDef = editingSport ? sportDefinition(editingSport.type) : null;
  const editingSupplementKind = editingSupplement
    ? supplementFromName(editingSupplement.name)
    : null;

  function refresh() {
    router.refresh();
  }

  function runDelete(id: string, work: () => Promise<void>) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      try {
        await work();
        setConfirm(null);
        refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not delete.");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      <h1 className={PAGE_TITLE}>Log</h1>

      <div className="grid grid-cols-4 gap-1 rounded-xl bg-chip/80 p-1">
        {(
          [
            ["all", "All"],
            ["gym", "Gym"],
            ["sports", "Sports"],
            ["supplements", "Supplements"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
            className={`min-h-11 rounded-lg px-1 text-[11px] font-bold transition-all duration-150 sm:text-xs ${
              filter === key ? "bg-paper text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}

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
            const gymLine = day.gym ? formatGymSummary(day.gym.hits) : null;
            return (
              <article key={day.date} className={`${CARD_CLS} overflow-hidden`}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenDate(open ? null : day.date)}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      {formatDisplayDate(day.date)}
                      {day.date === today ? (
                        <span className="ml-2 text-xs font-bold text-brand-text">
                          Today
                        </span>
                      ) : null}
                    </p>
                    <div className="mt-2 space-y-1">
                      {day.gym ? (
                        <p className="text-sm font-bold text-ink">
                          Gym{gymLine ? ` · ${gymLine}` : ""}
                        </p>
                      ) : null}
                      {day.sports.map((session) => {
                        const summary = formatSportSummary(session, distanceUnit);
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
                    aria-hidden="true"
                  />
                </button>

                {open ? (
                  <div className="space-y-5 border-t border-line px-4 py-4">
                    {(filter === "all" || filter === "gym") && (
                      <section className="space-y-2">
                        <p className={LABEL_CLS}>Gym</p>
                        <GymBar
                          date={day.date}
                          session={day.gym}
                          muscles={muscles}
                          onChange={(next) => {
                            setGym((current) => {
                              const without = current.filter(
                                (item) => item.date !== day.date,
                              );
                              return next
                                ? [next, ...without].sort((a, b) =>
                                    b.date.localeCompare(a.date),
                                  )
                                : without;
                            });
                            refresh();
                          }}
                        />
                        {day.gym ? (
                          <button
                            type="button"
                            disabled={pendingId != null}
                            onClick={() =>
                              setConfirm({
                                title: "Delete gym session?",
                                body: "This removes every muscle hit logged on this day.",
                                run: async () => {
                                  await deleteGymSession(day.gym!.id);
                                  setGym((current) =>
                                    current.filter((item) => item.id !== day.gym!.id),
                                  );
                                },
                              })
                            }
                            className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-danger-soft px-3 text-sm font-bold text-danger disabled:opacity-50"
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
                              const summary = formatSportSummary(session, distanceUnit);
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
                                    <span className="flex shrink-0 gap-1">
                                      <button
                                        type="button"
                                        className={GHOST_BTN}
                                        onClick={() => setEditingSport(session)}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        disabled={pendingId != null}
                                        className={DANGER_BTN}
                                        onClick={() =>
                                          setConfirm({
                                            title: "Delete sport?",
                                            body: `Remove this ${sportLabel(session.type).toLowerCase()} session?`,
                                            run: async () => {
                                              await deleteSport(session.id);
                                              setSportRows((current) =>
                                                current.filter((item) => item.id !== session.id),
                                              );
                                            },
                                          })
                                        }
                                      >
                                        Delete
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
                                <p className="min-w-0 truncate text-sm font-bold text-ink">
                                  {intake.name} · {intake.dose}
                                </p>
                                <span className="flex shrink-0 gap-1">
                                  {supplementFromName(intake.name) ? (
                                    <button
                                      type="button"
                                      className={GHOST_BTN}
                                      onClick={() => setEditingSupplement(intake)}
                                    >
                                      Edit
                                    </button>
                                  ) : null}
                                  <button
                                    type="button"
                                    disabled={pendingId != null}
                                    className={DANGER_BTN}
                                    onClick={() =>
                                      setConfirm({
                                        title: "Delete supplement?",
                                        body: `Remove ${intake.name} from this day?`,
                                        run: async () => {
                                          await deleteSupplement(intake.id);
                                          setSuppRows((current) =>
                                            current.filter((item) => item.id !== intake.id),
                                          );
                                        },
                                      })
                                    }
                                  >
                                    Delete
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
            setSportRows((current) =>
              [session, ...current.filter((item) => item.id !== session.id)].sort(
                (a, b) => b.date.localeCompare(a.date),
              ),
            );
            setEditingSport(null);
            refresh();
          }}
        />
      ) : null}

      {editingSupplement && editingSupplementKind ? (
        <SupplementFormSheet
          date={editingSupplement.date}
          kind={editingSupplementKind}
          initial={editingSupplement}
          onClose={() => setEditingSupplement(null)}
          onSave={(intake) => {
            setSuppRows((current) =>
              current.map((item) => (item.id === intake.id ? intake : item)),
            );
            setEditingSupplement(null);
            refresh();
          }}
        />
      ) : null}

      {confirm ? (
        <ConfirmSheet
          title={confirm.title}
          body={confirm.body}
          pending={pendingId != null}
          onClose={() => setConfirm(null)}
          onConfirm={() => runDelete("confirm", confirm.run)}
        />
      ) : null}
    </div>
  );
}
