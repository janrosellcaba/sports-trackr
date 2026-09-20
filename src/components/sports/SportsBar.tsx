"use client";

import { useState, useTransition } from "react";
import { deleteSport, logSport, updateSport } from "@/app/actions/sports";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { DateField } from "@/components/ui/DayPicker";
import { formatDisplayDate } from "@/lib/calculations";
import {
  EFFORT_LEVELS,
  SPORTS,
  effortLabel,
  formatSportSummary,
  sportDefinition,
  sportLabel,
  type SportDefinition,
  type SportTypeId,
} from "@/lib/sports";
import { CARD_CLS, GHOST_BTN, INPUT_CLS, LABEL_CLS, PRIMARY_BTN, SECONDARY_BTN, TAP_ROW, chipClass } from "@/lib/ui";
import { useUnits } from "@/components/units/UnitsProvider";
import {
  canonicalPace,
  displayPace,
  displayToKm,
  displayToMeters,
  formatInputNumber,
  kmToDisplay,
  metersToDisplay,
  shortDistanceLabel,
} from "@/lib/units";
import type { SportSessionPayload } from "@/types/trackr";

export function SportsBar({
  date,
  sessions,
  lockDate = false,
  onLogged,
  onRemoved,
}: {
  date: string;
  sessions: SportSessionPayload[];
  lockDate?: boolean;
  onLogged: (session: SportSessionPayload) => void;
  onRemoved: (id: string) => void;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { distanceUnit } = useUnits();
  const [, startTransition] = useTransition();
  const [creating, setCreating] = useState<SportDefinition | null>(null);
  const [editing, setEditing] = useState<SportSessionPayload | null>(null);
  const editingSport = editing ? sportDefinition(editing.type) : null;

  function handleUndo(id: string) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      try {
        await deleteSport(id);
        onRemoved(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not undo.");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <section className={`${CARD_CLS} space-y-3 p-4`}>
      <div>
        <p className={LABEL_CLS}>Sports session</p>
        <h2 className="text-base font-bold text-ink">Tap to log</h2>
        <p className="mt-0.5 text-xs text-muted">{formatDisplayDate(date)}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {SPORTS.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={pendingId != null}
            onClick={() => setCreating(item)}
            className={SECONDARY_BTN}
          >
            + {item.label}
          </button>
        ))}
      </div>

      {sessions.length > 0 ? (
        <ul className="space-y-1.5 border-t border-line pt-3">
          {sessions.map((session) => {
            const summary = formatSportSummary(session, distanceUnit);
            return (
              <li key={session.id} className="flex items-start justify-between gap-3 text-sm">
                <button
                  type="button"
                  className={`min-w-0 flex-1 text-left ${TAP_ROW}`}
                  onClick={() => setEditing(session)}
                >
                  <span className="font-medium text-ink">
                    {sportLabel(session.type)}
                    {summary ? ` · ${summary}` : ""}
                  </span>
                  {session.notes ? (
                    <span className="mt-0.5 block text-xs text-muted">{session.notes}</span>
                  ) : null}
                </button>
                <button
                  type="button"
                  disabled={pendingId != null}
                  onClick={() => handleUndo(session.id)}
                  className={GHOST_BTN}
                >
                  {pendingId === session.id ? "…" : "Undo"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted">Nothing logged yet.</p>
      )}

      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}

      {creating ? (
        <SportFormSheet
          date={date}
          sport={creating}
          lockDate={lockDate}
          onClose={() => setCreating(null)}
          onSave={(session) => {
            onLogged(session);
            setCreating(null);
          }}
        />
      ) : null}

      {editing && editingSport ? (
        <SportFormSheet
          date={editing.date}
          sport={editingSport}
          initial={editing}
          lockDate={false}
          onClose={() => setEditing(null)}
          onSave={(session) => {
            onLogged(session);
            setEditing(null);
          }}
        />
      ) : null}
    </section>
  );
}

export function SportFormSheet({
  date,
  sport,
  initial,
  lockDate = false,
  onClose,
  onSave,
}: {
  date: string;
  sport: SportDefinition;
  initial?: SportSessionPayload | null;
  lockDate?: boolean;
  onClose: () => void;
  onSave: (session: SportSessionPayload) => void;
}) {
  const { distanceUnit } = useUnits();
  const [logDate, setLogDate] = useState(initial?.date ?? date);
  const [distanceKm, setDistanceKm] = useState(
    initial?.distanceKm != null
      ? formatInputNumber(kmToDisplay(initial.distanceKm, distanceUnit))
      : "",
  );
  const [distanceM, setDistanceM] = useState(
    initial?.distanceMeters != null
      ? formatInputNumber(metersToDisplay(initial.distanceMeters, distanceUnit))
      : "",
  );
  const [duration, setDuration] = useState(
    initial?.durationMinutes != null ? String(initial.durationMinutes) : "",
  );
  const [pace, setPace] = useState(
    initial?.pace ? displayPace(initial.pace, distanceUnit) : "",
  );
  const [effort, setEffort] = useState<(typeof EFFORT_LEVELS)[number] | "">(
    initial?.effort && EFFORT_LEVELS.includes(initial.effort as (typeof EFFORT_LEVELS)[number])
      ? (initial.effort as (typeof EFFORT_LEVELS)[number])
      : "MODERATE",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fields = new Set(sport.fields);

  return (
    <BottomSheet title={initial ? `Edit ${sport.label}` : sport.label} onClose={onClose}>
      {!lockDate ? <DateField value={logDate} onChange={setLogDate} /> : null}
      {fields.has("distanceKm") ? (
        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-semibold text-ink">
            Distance ({distanceUnit})
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
            Distance ({shortDistanceLabel(distanceUnit)})
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
            Pace (min/{distanceUnit})
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
        <div className="mb-3">
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

      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-semibold text-ink">
          Comment <span className="font-normal text-muted">(optional)</span>
        </span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="How it felt, who you played…"
          rows={3}
          maxLength={280}
          className={`${INPUT_CLS} resize-none`}
        />
        <span className="mt-1 block text-right text-xs text-muted">
          {notes.length}/280
        </span>
      </label>

      {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}

      <button
        type="button"
        disabled={pending}
        className={`${PRIMARY_BTN} w-full bg-brand hover:bg-brand-dark`}
        onClick={() => {
          startTransition(async () => {
            try {
              const payload = {
                type: sport.id as SportTypeId,
                date: logDate,
                distanceKm: fields.has("distanceKm")
                  ? distanceKm.trim()
                    ? displayToKm(Number(distanceKm.replace(",", ".")), distanceUnit)
                    : null
                  : null,
                distanceMeters: fields.has("distanceM")
                  ? distanceM.trim()
                    ? displayToMeters(Number(distanceM.replace(",", ".")), distanceUnit)
                    : null
                  : null,
                durationMinutes: fields.has("durationMinutes") ? Number(duration) : null,
                pace: fields.has("pace")
                  ? canonicalPace(pace, distanceUnit)
                  : null,
                effort: fields.has("effort") ? effort : null,
                notes,
              };
              const session = initial
                ? await updateSport(initial.id, payload)
                : await logSport(payload);
              onSave(session);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not save.");
            }
          });
        }}
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </BottomSheet>
  );
}
