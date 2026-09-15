"use client";

import { useState, useTransition } from "react";
import { deleteSport, logSport } from "@/app/actions/sports";
import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  EFFORT_LEVELS,
  SPORTS,
  effortLabel,
  formatSportSummary,
  sportLabel,
  type SportDefinition,
  type SportTypeId,
} from "@/lib/sports";
import { CARD_CLS, INPUT_CLS, LABEL_CLS, PRIMARY_BTN, chipClass } from "@/lib/ui";
import type { SportSessionPayload } from "@/types/trackr";

export function SportsBar({
  date,
  sessions,
  onChange,
}: {
  date: string;
  sessions: SportSessionPayload[];
  onChange: (sessions: SportSessionPayload[]) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [active, setActive] = useState<SportDefinition | null>(null);

  function handleUndo(id: string) {
    startTransition(async () => {
      await deleteSport(id);
      onChange(sessions.filter((item) => item.id !== id));
    });
  }

  return (
    <section className={`${CARD_CLS} space-y-3 p-4`}>
      <div>
        <p className={LABEL_CLS}>Sports session</p>
        <h2 className="text-base font-bold text-ink">Tap to log</h2>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {SPORTS.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={isPending}
            onClick={() => setActive(item)}
            className="flex h-12 items-center justify-center rounded-xl bg-chip text-sm font-bold text-ink transition-all duration-150 hover:bg-chip-hover active:scale-[0.98] disabled:opacity-60"
          >
            + {item.label}
          </button>
        ))}
      </div>

      {sessions.length > 0 ? (
        <ul className="space-y-1.5 border-t border-line pt-3">
          {sessions.map((session) => {
            const summary = formatSportSummary(session);
            return (
              <li
                key={session.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="min-w-0 font-medium text-ink">
                  {sportLabel(session.type)}
                  {summary ? ` · ${summary}` : ""}
                </span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleUndo(session.id)}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-muted hover:text-danger disabled:opacity-50"
                >
                  Undo
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted">Nothing logged yet.</p>
      )}

      {active ? (
        <SportSheet
          date={date}
          sport={active}
          onClose={() => setActive(null)}
          onSave={(session) => {
            onChange([session, ...sessions]);
            setActive(null);
          }}
        />
      ) : null}
    </section>
  );
}

function SportSheet({
  date,
  sport,
  onClose,
  onSave,
}: {
  date: string;
  sport: SportDefinition;
  onClose: () => void;
  onSave: (session: SportSessionPayload) => void;
}) {
  const [distanceKm, setDistanceKm] = useState("");
  const [distanceM, setDistanceM] = useState("");
  const [duration, setDuration] = useState("");
  const [pace, setPace] = useState("");
  const [effort, setEffort] = useState<(typeof EFFORT_LEVELS)[number] | "">("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fields = new Set(sport.fields);

  return (
    <BottomSheet title={sport.label} onClose={onClose}>
      {fields.has("distanceKm") ? (
        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-semibold text-ink">
            Distance (km)
          </span>
          <input
            inputMode="decimal"
            value={distanceKm}
            onChange={(event) => setDistanceKm(event.target.value)}
            placeholder="5.2"
            className={INPUT_CLS}
          />
        </label>
      ) : null}

      {fields.has("distanceM") ? (
        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-semibold text-ink">
            Distance (m)
          </span>
          <input
            inputMode="decimal"
            value={distanceM}
            onChange={(event) => setDistanceM(event.target.value)}
            placeholder="1500"
            className={INPUT_CLS}
          />
        </label>
      ) : null}

      {fields.has("pace") ? (
        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-semibold text-ink">
            Pace (min/km)
          </span>
          <input
            value={pace}
            onChange={(event) => setPace(event.target.value)}
            placeholder="5:30"
            className={INPUT_CLS}
          />
        </label>
      ) : null}

      {fields.has("durationMinutes") ? (
        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-semibold text-ink">
            Time (min)
          </span>
          <input
            inputMode="numeric"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            placeholder="90"
            className={INPUT_CLS}
          />
        </label>
      ) : null}

      {fields.has("effort") ? (
        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold text-ink">Effort</p>
          <div className="grid grid-cols-3 gap-2">
            {EFFORT_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setEffort(level)}
                className={chipClass(effort === level)}
              >
                {effortLabel(level)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}

      <button
        type="button"
        disabled={pending}
        className={`${PRIMARY_BTN} w-full bg-brand hover:bg-brand-dark`}
        onClick={() => {
          startTransition(async () => {
            try {
              const session = await logSport({
                type: sport.id as SportTypeId,
                date,
                distanceKm: fields.has("distanceKm") ? Number(distanceKm.replace(",", ".")) : null,
                distanceMeters: fields.has("distanceM")
                  ? Number(distanceM.replace(",", "."))
                  : null,
                durationMinutes: fields.has("durationMinutes") ? Number(duration) : null,
                pace: fields.has("pace") ? pace : null,
                effort: fields.has("effort") ? effort : null,
              });
              onSave(session);
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
