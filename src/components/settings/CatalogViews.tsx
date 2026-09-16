"use client";

import { useEffect, useState, useTransition } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  createCustomExercise,
  createCustomSupplement,
  createMuscle,
  deleteCustomExercise,
  deleteCustomSupplement,
  deleteMuscle,
  moveMuscle,
  updateCustomExercise,
  updateCustomSupplement,
  updateMuscle,
} from "@/app/actions/catalog";
import { formatLift, parseCustomExerciseInput, parseCustomSupplementInput } from "@/lib/catalog";
import { CARD_CLS, INPUT_CLS, PRIMARY_BTN } from "@/lib/ui";
import type {
  CustomExercisePayload,
  CustomSupplementPayload,
  MusclePayload,
} from "@/types/trackr";

export function MuscleCatalogView({
  initial,
  onChange,
}: {
  initial: MusclePayload[];
  onChange?: (rows: MusclePayload[]) => void;
}) {
  const [muscles, setMuscles] = useState(initial);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<MusclePayload | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setMuscles(initial);
  }, [initial]);

  function commit(rows: MusclePayload[]) {
    setMuscles(rows);
    onChange?.(rows);
  }

  return (
    <section className={`${CARD_CLS} space-y-3 p-4`}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink">Muscles</h2>
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
      <p className="text-xs text-muted">
        These are the tap targets on Home. Split Back into Lats and Traps by adding
        both, then delete Back if you no longer need it.
      </p>
      {muscles.length === 0 ? (
        <p className="text-sm text-muted">None yet.</p>
      ) : (
        <ul className="space-y-2">
          {muscles.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-chip px-3 py-2"
            >
              <span className="min-w-0 text-sm font-medium text-ink">{item.name}</span>
              <span className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={pending || index === 0}
                  className="text-xs font-bold text-muted disabled:opacity-30"
                  onClick={() => {
                    startTransition(async () => {
                      commit(await moveMuscle(item.id, "up"));
                    });
                  }}
                >
                  Up
                </button>
                <button
                  type="button"
                  disabled={pending || index === muscles.length - 1}
                  className="text-xs font-bold text-muted disabled:opacity-30"
                  onClick={() => {
                    startTransition(async () => {
                      commit(await moveMuscle(item.id, "down"));
                    });
                  }}
                >
                  Down
                </button>
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
                    await deleteMuscle(item.id);
                    commit(muscles.filter((row) => row.id !== item.id));
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
    </section>
  );
}

export function ExerciseCatalogView({
  initial,
  muscles,
  onChange,
}: {
  initial: CustomExercisePayload[];
  muscles: MusclePayload[];
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
        <h2 className="text-sm font-bold text-ink">Notebook</h2>
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
      {exercises.length === 0 ? (
        <p className="text-sm text-muted">None yet. Add a lift and optional working weight.</p>
      ) : (
        <ul className="max-h-[28rem] space-y-2 overflow-y-auto">
          {exercises.map((item) => {
            const working = formatLift(item.workingWeight, item.workingReps);
            const pr = formatLift(item.prWeight, item.prReps);
            return (
              <li
                key={item.id}
                className="flex items-start justify-between gap-2 rounded-xl bg-chip px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink">
                    {item.name}
                    {item.muscleName ? (
                      <span className="text-muted"> · {item.muscleName}</span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {working ? `Work ${working}` : "No working set"}
                    {pr ? ` · PR ${pr}` : ""}
                  </span>
                </span>
                <span className="flex shrink-0 gap-2 pt-0.5">
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
      {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}
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
        Save
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
  const [weight, setWeight] = useState(initial?.workingWeight?.toString() ?? "");
  const [reps, setReps] = useState(initial?.workingReps?.toString() ?? "");
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
          className={INPUT_CLS}
        >
          <option value="">None</option>
          {muscles.map((muscle) => (
            <option key={muscle.id} value={muscle.id}>
              {muscle.name}
            </option>
          ))}
        </select>
      </label>
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">
        Working set
      </p>
      <p className="mb-2 text-xs text-muted">
        Optional notebook note. PRs are logged from Home.
      </p>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <label>
          <span className="mb-1 block text-sm font-semibold text-ink">kg</span>
          <input
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            inputMode="decimal"
            className={INPUT_CLS}
          />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold text-ink">Reps</span>
          <input
            value={reps}
            onChange={(event) => setReps(event.target.value)}
            inputMode="numeric"
            className={INPUT_CLS}
          />
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
                muscleId: muscleId || null,
                workingWeight: weight ? Number(weight) : null,
                workingReps: reps ? Number(reps) : null,
                prWeight: initial?.prWeight ?? null,
                prReps: initial?.prReps ?? null,
                prDate: initial?.prDate ?? null,
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

function sortMuscles(rows: MusclePayload[]): MusclePayload[] {
  return [...rows].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  );
}
