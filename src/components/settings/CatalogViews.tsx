"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import {
  createCustomExercise,
  createMuscle,
  deleteCustomExercise,
  deleteMuscle,
  moveMuscle,
  updateCustomExercise,
  updateMuscle,
} from "@/app/actions/catalog";
import { formatLift, parseCustomExerciseInput } from "@/lib/catalog";
import { useUnits } from "@/components/units/UnitsProvider";
import { useLatestProps } from "@/lib/use-latest-props";
import {
  CARD_CLS,
  DANGER_BTN,
  GHOST_BTN,
  INPUT_CLS,
  PRIMARY_BTN,
  SELECT_CLS,
} from "@/lib/ui";
import type {
  CustomExercisePayload,
  MusclePayload,
} from "@/types/trackr";

export function MuscleCatalogView({
  initial,
}: {
  initial: MusclePayload[];
}) {
  const router = useRouter();
  const [muscles, setMuscles] = useLatestProps(initial);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<MusclePayload | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MusclePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function commit(rows: MusclePayload[]) {
    setMuscles(rows);
    router.refresh();
  }

  return (
    <section className={`${CARD_CLS} space-y-3 p-4`}>
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
          className={`${GHOST_BTN} text-brand-text`}
        >
          + Add
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      {muscles.length === 0 ? (
        <p className="text-sm text-muted">None yet.</p>
      ) : (
        <ul className="space-y-2">
          {muscles.map((item, index) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 rounded-xl bg-chip px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="min-w-0 truncate text-sm font-medium text-ink">
                {item.name}
              </span>
              <span className="flex flex-wrap justify-end gap-1">
                <button
                  type="button"
                  disabled={pendingId != null || index === 0}
                  className={GHOST_BTN}
                  onClick={() => {
                    setError(null);
                    setPendingId(item.id);
                    startTransition(async () => {
                      try {
                        commit(await moveMuscle(item.id, "up"));
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Could not move.");
                      } finally {
                        setPendingId(null);
                      }
                    });
                  }}
                >
                  Up
                </button>
                <button
                  type="button"
                  disabled={pendingId != null || index === muscles.length - 1}
                  className={GHOST_BTN}
                  onClick={() => {
                    setError(null);
                    setPendingId(item.id);
                    startTransition(async () => {
                      try {
                        commit(await moveMuscle(item.id, "down"));
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Could not move.");
                      } finally {
                        setPendingId(null);
                      }
                    });
                  }}
                >
                  Down
                </button>
                <button
                  type="button"
                  className={GHOST_BTN}
                  onClick={() => {
                    setEditing(item);
                    setSheetOpen(true);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={DANGER_BTN}
                  onClick={() => setPendingDelete(item)}
                >
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {sheetOpen ? (
        <MuscleSheet
          initial={editing}
          onClose={() => setSheetOpen(false)}
          onSave={(row) => {
            commit(
              sortMuscles(
                muscles.some((item) => item.id === row.id)
                  ? muscles.map((item) => (item.id === row.id ? row : item))
                  : [...muscles, row],
              ),
            );
            setSheetOpen(false);
          }}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmSheet
          title={`Delete ${pendingDelete.name}?`}
          body="This muscle will leave Settings. Hits already logged stay on those days."
          confirmLabel="Delete muscle"
          pending={pendingId === pendingDelete.id}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => {
            const target = pendingDelete;
            setError(null);
            setPendingId(target.id);
            startTransition(async () => {
              try {
                await deleteMuscle(target.id);
                commit(muscles.filter((row) => row.id !== target.id));
                setPendingDelete(null);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not delete.");
                setPendingDelete(null);
              } finally {
                setPendingId(null);
              }
            });
          }}
        />
      ) : null}
    </section>
  );
}

export function ExerciseCatalogView({
  initial,
  muscles,
}: {
  initial: CustomExercisePayload[];
  muscles: MusclePayload[];
}) {
  const router = useRouter();
  const { massUnit } = useUnits();
  const [exercises, setExercises] = useLatestProps(initial);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<CustomExercisePayload | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CustomExercisePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function commit(rows: CustomExercisePayload[]) {
    setExercises(rows);
    router.refresh();
  }

  return (
    <section className={`${CARD_CLS} space-y-3 p-4`}>
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
          className={`${GHOST_BTN} text-brand-text`}
        >
          + Add
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      {exercises.length === 0 ? (
        <p className="text-sm text-muted">
          None yet. Add a lift here, then log PRs from Home.
        </p>
      ) : (
        <ul className="space-y-2">
          {exercises.map((item) => {
            const pr = formatLift(item.prWeight, item.prReps, massUnit, item.dualWeights);
            return (
              <li
                key={item.id}
                className="flex flex-col gap-2 rounded-xl bg-chip px-3 py-2 sm:flex-row sm:items-start sm:justify-between"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">
                    {item.name}
                    {item.muscleName ? (
                      <span className="text-muted"> · {item.muscleName}</span>
                    ) : null}
                    {item.dualWeights ? (
                      <span className="ml-1 rounded-md bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-text">
                        2×
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {pr ? `PR ${pr}` : "No PR yet"}
                  </span>
                </span>
                <span className="flex shrink-0 justify-end gap-1">
                  <button
                    type="button"
                    className={GHOST_BTN}
                    onClick={() => {
                      setEditing(item);
                      setSheetOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={DANGER_BTN}
                    onClick={() => setPendingDelete(item)}
                  >
                    Delete
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {sheetOpen ? (
        <ExerciseSheet
          initial={editing}
          muscles={muscles}
          onClose={() => setSheetOpen(false)}
          onSave={(row) => {
            commit(
              sortByName(
                exercises.some((item) => item.id === row.id)
                  ? exercises.map((item) => (item.id === row.id ? row : item))
                  : [row, ...exercises],
              ),
            );
            setSheetOpen(false);
          }}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmSheet
          title={`Delete ${pendingDelete.name}?`}
          body="This removes the lift and its progression snapshots. Logged PRs on this exercise will be gone."
          confirmLabel="Delete exercise"
          pending={pendingId === pendingDelete.id}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => {
            const target = pendingDelete;
            setError(null);
            setPendingId(target.id);
            startTransition(async () => {
              try {
                await deleteCustomExercise(target.id);
                commit(exercises.filter((row) => row.id !== target.id));
                setPendingDelete(null);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not delete.");
                setPendingDelete(null);
              } finally {
                setPendingId(null);
              }
            });
          }}
        />
      ) : null}
    </section>
  );
}

function MuscleSheet({
  initial,
  onClose,
  onSave,
}: {
  initial: MusclePayload | null;
  onClose: () => void;
  onSave: (row: MusclePayload) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <BottomSheet title={initial ? "Rename muscle" : "Add muscle"} onClose={onClose}>
      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-semibold text-ink">Name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Lats, Calves…"
          className={INPUT_CLS}
        />
      </label>
      {error ? (
        <p role="alert" className="mb-3 text-sm text-danger">
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
              const row = initial
                ? await updateMuscle({ id: initial.id, name })
                : await createMuscle({ name });
              onSave(row);
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

function ExerciseSheet({
  initial,
  muscles,
  onClose,
  onSave,
}: {
  initial: CustomExercisePayload | null;
  muscles: MusclePayload[];
  onClose: () => void;
  onSave: (row: CustomExercisePayload) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [muscleId, setMuscleId] = useState(initial?.muscleId ?? "");
  const [dualWeights, setDualWeights] = useState(initial?.dualWeights ?? false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <BottomSheet title={initial ? "Edit exercise" : "Add exercise"} onClose={onClose}>
      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-semibold text-ink">Name</span>
        <input value={name} onChange={(event) => setName(event.target.value)} className={INPUT_CLS} />
      </label>
      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-semibold text-ink">Muscle</span>
        <select
          value={muscleId}
          onChange={(event) => setMuscleId(event.target.value)}
          className={SELECT_CLS}
        >
          <option value="">None</option>
          {muscles.map((muscle) => (
            <option key={muscle.id} value={muscle.id}>
              {muscle.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        role="switch"
        aria-checked={dualWeights}
        onClick={() => setDualWeights((current) => !current)}
        className="mb-4 flex w-full items-start gap-3 rounded-xl bg-chip px-3 py-3 text-left transition-all duration-150 hover:bg-chip-hover motion-safe:hover:scale-[1.01] motion-safe:active:scale-[0.99]"
      >
        <span
          className={`mt-0.5 flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors duration-150 ${
            dualWeights ? "bg-brand" : "bg-line"
          }`}
        >
          <span
            className={`h-5 w-5 rounded-full bg-paper shadow-sm transition-transform duration-150 ${
              dualWeights ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </span>
        <span>
          <span className="block text-sm font-semibold text-ink">Two weights</span>
          <span className="text-xs text-muted">
            Log one dumbbell. PRs show as a pair (30kg each reads as 2× 30kg).
          </span>
        </span>
      </button>
      {error ? (
        <p role="alert" className="mb-3 text-sm text-danger">
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
              const parsed = parseCustomExerciseInput({
                name,
                muscleId: muscleId || null,
                workingWeight: initial?.workingWeight ?? null,
                workingReps: initial?.workingReps ?? null,
                prWeight: initial?.prWeight ?? null,
                prReps: initial?.prReps ?? null,
                prDate: initial?.prDate ?? null,
                dualWeights,
              });
              const row = initial
                ? await updateCustomExercise({ id: initial.id, ...parsed })
                : await createCustomExercise(parsed);
              onSave(row);
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

function sortByName<T extends { name: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name));
}

function sortMuscles(rows: MusclePayload[]): MusclePayload[] {
  return [...rows].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  );
}
