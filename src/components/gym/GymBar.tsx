"use client";

import { useState, useTransition } from "react";
import { deleteMuscleHit, upsertMuscleHit } from "@/app/actions/gym";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { formatDisplayDate, getTodayLocalDateISO } from "@/lib/calculations";
import {
  INTENSITY_LEVELS,
  formatGymSummary,
  intensityLabel,
} from "@/lib/muscles";
import { CARD_CLS, LABEL_CLS, PRIMARY_BTN, chipClass } from "@/lib/ui";
import type {
  GymSessionPayload,
  MuscleHitPayload,
  MusclePayload,
} from "@/types/trackr";

export function GymBar({
  date,
  session,
  muscles,
  onChange,
}: {
  date: string;
  session: GymSessionPayload | null;
  muscles: MusclePayload[];
  onChange: (session: GymSessionPayload | null) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<MusclePayload | null>(null);
  const hits = session?.hits ?? [];
  const hitByMuscleId = new Map(
    hits.filter((hit) => hit.muscleId).map((hit) => [hit.muscleId as string, hit]),
  );

  function handleUndo(hit: MuscleHitPayload) {
    startTransition(async () => {
      const next = await deleteMuscleHit(hit.id);
      onChange(next);
    });
  }

  return (
    <section className={`${CARD_CLS} space-y-3 p-4`}>
      <div>
        <p className={LABEL_CLS}>Gym session</p>
        <h2 className="text-base font-bold text-ink">Tap to log</h2>
        {date !== getTodayLocalDateISO() ? (
          <p className="mt-0.5 text-xs text-muted">{formatDisplayDate(date)}</p>
        ) : null}
        <p className="mt-1 text-xs text-muted">1 light → 5 wrecked</p>
      </div>

      {muscles.length === 0 ? (
        <p className="text-sm text-muted">
          Add muscles in Settings, then tap them after a session.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {muscles.map((muscle) => {
            const hit = hitByMuscleId.get(muscle.id);
            return (
              <button
                key={muscle.id}
                type="button"
                disabled={isPending}
                onClick={() => setEditing(muscle)}
                className={`flex min-h-12 flex-col items-center justify-center rounded-xl px-2 py-2 text-center transition-all duration-150 active:scale-[0.98] disabled:opacity-60 ${
                  hit
                    ? "bg-brand text-[color:var(--accent-fg)] shadow-sm"
                    : "bg-chip text-ink hover:bg-chip-hover"
                }`}
              >
                <span className="text-xs font-bold leading-tight">{muscle.name}</span>
                {hit ? (
                  <span className="mt-0.5 font-mono text-[11px] opacity-90">
                    {hit.intensity}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {hits.length > 0 ? (
        <ul className="space-y-1.5 border-t border-line pt-3">
          {hits.map((hit) => (
            <li key={hit.id} className="flex items-center justify-between gap-3 text-sm">
              <button
                type="button"
                className="min-w-0 flex-1 text-left font-medium text-ink"
                onClick={() => {
                  const muscle = muscles.find((item) => item.id === hit.muscleId);
                  if (muscle) setEditing(muscle);
                }}
              >
                {hit.muscleName}
                <span className="text-muted">
                  {" "}
                  · {hit.intensity} {intensityLabel(hit.intensity)}
                </span>
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleUndo(hit)}
                className="rounded-md px-2 py-1 text-xs font-semibold text-muted hover:text-danger disabled:opacity-50"
              >
                Undo
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          {formatGymSummary(hits) || "Nothing logged yet."}
        </p>
      )}

      {editing ? (
        <IntensitySheet
          date={date}
          muscle={editing}
          current={hitByMuscleId.get(editing.id) ?? null}
          onClose={() => setEditing(null)}
          onSave={(next) => {
            onChange(next);
            setEditing(null);
          }}
          onClear={(next) => {
            onChange(next);
            setEditing(null);
          }}
        />
      ) : null}
    </section>
  );
}

function IntensitySheet({
  date,
  muscle,
  current,
  onClose,
  onSave,
  onClear,
}: {
  date: string;
  muscle: MusclePayload;
  current: MuscleHitPayload | null;
  onClose: () => void;
  onSave: (session: GymSessionPayload) => void;
  onClear: (session: GymSessionPayload | null) => void;
}) {
  const [intensity, setIntensity] = useState(current?.intensity ?? 3);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <BottomSheet
      title={muscle.name}
      onClose={onClose}
    >
      <p className="mb-3 text-sm text-muted">How hard did this muscle work today?</p>
      <div className="mb-4 grid grid-cols-5 gap-2">
        {INTENSITY_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => setIntensity(level)}
            className={`${chipClass(intensity === level)} flex flex-col items-center px-1 py-2`}
          >
            <span className="font-mono text-base">{level}</span>
            <span className="text-[10px] font-semibold leading-tight">
              {intensityLabel(level)}
            </span>
          </button>
        ))}
      </div>
      {error ? <p className="mb-3 text-sm font-medium text-danger">{error}</p> : null}
      <button
        type="button"
        disabled={pending}
        className={`${PRIMARY_BTN} w-full bg-brand hover:bg-brand-dark`}
        onClick={() => {
          startTransition(async () => {
            try {
              const session = await upsertMuscleHit({
                date,
                muscleId: muscle.id,
                intensity,
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
      {current ? (
        <button
          type="button"
          disabled={pending}
          className="mt-2 w-full py-2 text-sm font-bold text-muted hover:text-danger"
          onClick={() => {
            startTransition(async () => {
              try {
                const next = await deleteMuscleHit(current.id);
                onClear(next);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not remove.");
              }
            });
          }}
        >
          Remove
        </button>
      ) : null}
    </BottomSheet>
  );
}
