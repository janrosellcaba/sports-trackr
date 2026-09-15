"use client";

import { useEffect, useState, useTransition } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  createCustomExercise,
  createCustomSupplement,
  deleteCustomExercise,
  deleteCustomSupplement,
  updateCustomExercise,
  updateCustomSupplement,
} from "@/app/actions/catalog";
import {
  MUSCLE_GROUP_KEYS,
  muscleGroupLabel,
  parseCustomExerciseInput,
  parseCustomSupplementInput,
} from "@/lib/catalog";
import { CARD_CLS, INPUT_CLS, PRIMARY_BTN } from "@/lib/ui";
import type {
  CustomExercisePayload,
  CustomSupplementPayload,
} from "@/types/trackr";

export function ExerciseCatalogView({
  initial,
  onChange,
}: {
  initial: CustomExercisePayload[];
  onChange?: (rows: CustomExercisePayload[]) => void;
}) {
  const [exercises, setExercises] = useState(initial);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<CustomExercisePayload | null>(null);

  useEffect(() => {
    setExercises(initial);
  }, [initial]);

  function commit(rows: CustomExercisePayload[]) {
    setExercises(rows);
    onChange?.(rows);
  }

  return (
    <section className={`${CARD_CLS} space-y-3 p-4`}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink">Catalog</h2>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
          className="text-sm font-bold text-brand"
        >
          + Add
        </button>
      </div>
      <p className="text-sm text-muted">
        Shown when you add an exercise on Home.
      </p>
      {exercises.length === 0 ? (
        <p className="text-sm text-muted">None yet. Add one to log gym.</p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {exercises.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-xl bg-chip px-3 py-2"
            >
              <span className="text-sm font-medium text-ink">
                {item.name}{" "}
                <span className="text-muted">
                  · {muscleGroupLabel(item.muscleGroup)}
                </span>
              </span>
              <span className="flex gap-2">
                <button
                  type="button"
                  className="text-xs font-bold text-muted"
                  onClick={() => {
                    setEditing(item);
                    setSheetOpen(true);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-xs font-bold text-danger"
                  onClick={async () => {
                    await deleteCustomExercise(item.id);
                    commit(exercises.filter((row) => row.id !== item.id));
                  }}
                >
                  Del
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {sheetOpen ? (
        <ExerciseSheet
          initial={editing}
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
    </section>
  );
}

export function SupplementCatalogView({
  initial,
  onChange,
}: {
  initial: CustomSupplementPayload[];
  onChange?: (rows: CustomSupplementPayload[]) => void;
}) {
  const [supplements, setSupplements] = useState(initial);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<CustomSupplementPayload | null>(null);

  useEffect(() => {
    setSupplements(initial);
  }, [initial]);

  function commit(rows: CustomSupplementPayload[]) {
    setSupplements(rows);
    onChange?.(rows);
  }

  return (
    <section className={`${CARD_CLS} space-y-3 p-4`}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink">Catalog</h2>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
          className="text-sm font-bold text-brand"
        >
          + Add
        </button>
      </div>
      <p className="text-sm text-muted">
        Shown as tap targets on Home.
      </p>
      {supplements.length === 0 ? (
        <p className="text-sm text-muted">None yet. Add one to log from Home.</p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto">
          {supplements.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-xl bg-chip px-3 py-2"
            >
              <span className="text-sm font-medium text-ink">
                {item.name}{" "}
                <span className="text-muted">· {item.defaultDose}</span>
              </span>
              <span className="flex gap-2">
                <button
                  type="button"
                  className="text-xs font-bold text-muted"
                  onClick={() => {
                    setEditing(item);
                    setSheetOpen(true);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-xs font-bold text-danger"
                  onClick={async () => {
                    await deleteCustomSupplement(item.id);
                    commit(supplements.filter((row) => row.id !== item.id));
                  }}
                >
                  Del
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {sheetOpen ? (
        <SupplementSheet
          initial={editing}
          onClose={() => setSheetOpen(false)}
          onSave={(row) => {
            commit(
              sortByName(
                supplements.some((item) => item.id === row.id)
                  ? supplements.map((item) => (item.id === row.id ? row : item))
                  : [row, ...supplements],
              ),
            );
            setSheetOpen(false);
          }}
        />
      ) : null}
    </section>
  );
}

function ExerciseSheet({
  initial,
  onClose,
  onSave,
}: {
  initial: CustomExercisePayload | null;
  onClose: () => void;
  onSave: (row: CustomExercisePayload) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [muscleGroup, setMuscleGroup] = useState(initial?.muscleGroup ?? "CHEST");
  const [weight, setWeight] = useState(initial?.defaultWeight?.toString() ?? "");
  const [reps, setReps] = useState(initial?.defaultReps?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <BottomSheet title={initial ? "Edit exercise" : "Add exercise"} onClose={onClose}>
      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-semibold text-ink">Name</span>
        <input value={name} onChange={(event) => setName(event.target.value)} className={INPUT_CLS} />
      </label>
      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-semibold text-ink">Muscle group</span>
        <select
          value={muscleGroup}
          onChange={(event) => setMuscleGroup(event.target.value)}
          className={INPUT_CLS}
        >
          {MUSCLE_GROUP_KEYS.map((key) => (
            <option key={key} value={key}>
              {muscleGroupLabel(key)}
            </option>
          ))}
        </select>
      </label>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <label>
          <span className="mb-1 block text-sm font-semibold text-ink">Default kg</span>
          <input value={weight} onChange={(event) => setWeight(event.target.value)} className={INPUT_CLS} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold text-ink">Default reps</span>
          <input value={reps} onChange={(event) => setReps(event.target.value)} className={INPUT_CLS} />
        </label>
      </div>
      {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}
      <button
        type="button"
        disabled={pending}
        className={`${PRIMARY_BTN} w-full bg-brand hover:bg-brand-dark`}
        onClick={() => {
          startTransition(async () => {
            try {
              const parsed = parseCustomExerciseInput({
                name,
                muscleGroup,
                defaultWeight: weight ? Number(weight) : null,
                defaultReps: reps ? Number(reps) : null,
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
        Save
      </button>
    </BottomSheet>
  );
}

function SupplementSheet({
  initial,
  onClose,
  onSave,
}: {
  initial: CustomSupplementPayload | null;
  onClose: () => void;
  onSave: (row: CustomSupplementPayload) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [dose, setDose] = useState(initial?.defaultDose ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <BottomSheet title={initial ? "Edit supplement" : "Add supplement"} onClose={onClose}>
      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-semibold text-ink">Name</span>
        <input value={name} onChange={(event) => setName(event.target.value)} className={INPUT_CLS} />
      </label>
      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-semibold text-ink">Default dose</span>
        <input
          value={dose}
          onChange={(event) => setDose(event.target.value)}
          placeholder="5g, 1 scoop…"
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
              const parsed = parseCustomSupplementInput({
                name,
                defaultDose: dose,
              });
              const row = initial
                ? await updateCustomSupplement({ id: initial.id, ...parsed })
                : await createCustomSupplement(parsed);
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

function sortByName<T extends { name: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name));
}
