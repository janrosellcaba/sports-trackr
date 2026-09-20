"use client";

import { useState, useTransition } from "react";
import { deleteMuscleHit, upsertMuscleHit } from "@/app/actions/gym";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { INTENSITY_LEVELS, intensityLabel } from "@/lib/muscles";
import {
  formatRecoveryDetail,
  formatRecoveryShort,
  recoveryAriaLabel,
} from "@/lib/recovery";
import { CARD_CLS, DANGER_BTN, GHOST_BTN, LABEL_CLS, PRIMARY_BTN, TAP_ROW, chipClass } from "@/lib/ui";
import type {
  GymSessionPayload,
  MuscleHitPayload,
  MusclePayload,
  MuscleRecoveryPayload,
} from "@/types/trackr";

export function GymBar({
  date,
  session,
  muscles,
  recovery = [],
  showHeading = true,
  onChange,
}: {
  date: string;
  session: GymSessionPayload | null;
  muscles: MusclePayload[];
  recovery?: MuscleRecoveryPayload[];
  showHeading?: boolean;
  onChange: (session: GymSessionPayload | null) => void;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<MusclePayload | null>(null);
  const [, startTransition] = useTransition();
  const hits = session?.hits ?? [];
  const hitByMuscleId = new Map(hits.map((hit) => [hit.muscleId, hit]));
  const recoveryByMuscleId = new Map(recovery.map((item) => [item.muscleId, item]));

  function handleUndo(hit: MuscleHitPayload) {
    setError(null);
    setPendingId(hit.id);
    startTransition(async () => {
      try {
        const next = await deleteMuscleHit(hit.id);
        onChange(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not undo.");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <section className={`${showHeading ? `${CARD_CLS} p-4` : ""} space-y-3`}>
      {showHeading ? <p className={LABEL_CLS}>Gym</p> : null}

      {muscles.length === 0 ? (
        <p className="text-sm text-muted">Add muscles in Settings.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {muscles.map((muscle) => {
            const hit = hitByMuscleId.get(muscle.id);
            const last = recoveryByMuscleId.get(muscle.id);
            return (
              <button
                key={muscle.id}
                type="button"
                aria-label={recoveryAriaLabel(muscle.name, hit, last)}
                onClick={() => setEditing(muscle)}
                className={`flex min-h-12 flex-col items-center justify-center rounded-xl px-2 py-2 text-center transition-all duration-150 motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.98] ${
                  hit
                    ? "bg-brand text-[color:var(--accent-fg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]"
                    : "bg-chip text-ink hover:bg-chip-hover"
                }`}
              >
                <span className="truncate text-xs font-bold leading-tight">
                  {muscle.name}
                </span>
                {hit ? (
                  <span className="mt-0.5 font-mono text-[11px] opacity-90">
                    {hit.intensity}
                  </span>
                ) : last ? (
                  <span className="mt-0.5 text-[10px] font-semibold text-muted">
                    {formatRecoveryShort(last.daysAgo)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}

      {hits.length > 0 ? (
        <ul className="space-y-1.5 border-t border-line pt-3">
          {hits.map((hit) => (
            <li key={hit.id} className="flex items-center justify-between gap-3 text-sm">
              <button
                type="button"
                className={`min-h-11 min-w-0 flex-1 text-left font-medium text-ink ${TAP_ROW}`}
                onClick={() => {
                  const muscle = muscles.find((item) => item.id === hit.muscleId);
                  if (muscle) setEditing(muscle);
                }}
              >
                <span className="truncate">{hit.muscleName}</span>
                <span className="text-muted"> · {hit.intensity}</span>
              </button>
              <button
                type="button"
                disabled={pendingId === hit.id}
                onClick={() => handleUndo(hit)}
                className={GHOST_BTN}
              >
                {pendingId === hit.id ? "…" : "Undo"}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {editing ? (
        <IntensitySheet
          date={date}
          muscle={editing}
          current={hitByMuscleId.get(editing.id) ?? null}
          recovery={recoveryByMuscleId.get(editing.id) ?? null}
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
  recovery,
  onClose,
  onSave,
  onClear,
}: {
  date: string;
  muscle: MusclePayload;
  current: MuscleHitPayload | null;
  recovery: MuscleRecoveryPayload | null;
  onClose: () => void;
  onSave: (session: GymSessionPayload) => void;
  onClear: (session: GymSessionPayload | null) => void;
}) {
  const [intensity, setIntensity] = useState(current?.intensity ?? 3);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <BottomSheet title={muscle.name} onClose={onClose}>
      {recovery ? (
        <p className="mb-3 text-sm text-muted">{formatRecoveryDetail(recovery)}</p>
      ) : null}
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-5">
        {INTENSITY_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            aria-pressed={intensity === level}
            onClick={() => setIntensity(level)}
            className={`${chipClass(intensity === level)} flex min-h-12 items-center justify-between gap-3 px-3 py-2 sm:min-h-14 sm:flex-col sm:justify-center sm:px-1`}
          >
            <span className="font-mono text-base">{level}</span>
            <span className="text-sm font-semibold leading-tight sm:text-[10px]">
              {intensityLabel(level)}
            </span>
          </button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="mb-3 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
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
        {pending ? "Saving…" : "Save"}
      </button>
      {current ? (
        <button
          type="button"
          disabled={pending}
          className={`${DANGER_BTN} mt-2 w-full`}
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
