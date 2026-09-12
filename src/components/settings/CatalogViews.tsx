"use client";

import { useState, useTransition } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  MUSCLE_GROUP_KEYS,
  muscleGroupLabel,
  parseCustomExerciseInput,
  parseCustomSupplementInput,
} from "@/lib/catalog";
import { runMutation } from "@/lib/offline/mutate";
import { CARD_CLS, INPUT_CLS, PRIMARY_BTN } from "@/lib/ui";
import type {
  CustomExercisePayload,
  CustomSupplementPayload,
} from "@/types/trackr";

export function ExerciseCatalogView({
  initial,
}: {
  initial: CustomExercisePayload[];
}) {
  const [exercises, setExercises] = useState(initial);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<CustomExercisePayload | null>(null);

  return (
    <section className={`${CARD_CLS} space-y-3 p-4`}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink">Custom exercises</h2>
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
        <p className="text-sm text-muted">No custom exercises yet.</p>
      ) : (
        <ul className="space-y-2">
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
                    await runMutation(
                      "deleteCustomExercise",
                      { id: item.id },
                      undefined,
                    );
                    setExercises((rows) =>
                      rows.filter((row) => row.id !== item.id),
                    );
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
            setExercises((rows) =>
              rows.some((item) => item.id === row.id)
                ? rows.map((item) => (item.id === row.id ? row : item))
                : [row, ...rows],
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
}: {
  initial: CustomSupplementPayload[];
}) {
  const [supplements, setSupplements] = useState(initial);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<CustomSupplementPayload | null>(null);

  return (
    <section className={`${CARD_CLS} space-y-3 p-4`}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink">Custom supplements</h2>
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
        <p className="text-sm text-muted">No custom supplements yet.</p>
      ) : (
        <ul className="space-y-2">
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
                    await runMutation(
                      "deleteCustomSupplement",
                      { id: item.id },
                      undefined,
                    );
                    setSupplements((rows) =>
                      rows.filter((row) => row.id !== item.id),
                    );
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
            setSupplements((rows) =>
              rows.some((item) => item.id === row.id)
                ? rows.map((item) => (item.id === row.id ? row : item))
                : [row, ...rows],
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
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={INPUT_CLS}
        />
      </label>
      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-semibold text-ink">
          Muscle group
        </span>
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
          <span className="mb-1 block text-sm font-semibold text-ink">
            Default kg
          </span>
          <input
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            className={INPUT_CLS}
          />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold text-ink">
            Default reps
          </span>
          <input
            value={reps}
            onChange={(event) => setReps(event.target.value)}
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
                muscleGroup,
                defaultWeight: weight ? Number(weight) : null,
                defaultReps: reps ? Number(reps) : null,
              });
              const payload = {
                id: initial?.id ?? crypto.randomUUID(),
                ...parsed,
              };
              const kind = initial ? "updateCustomExercise" : "createCustomExercise";
              const fallback: CustomExercisePayload = {
                ...payload,
                createdAt: initial?.createdAt ?? new Date().toISOString(),
              };
              const result = await runMutation(kind, payload, fallback);
              onSave(result.data);
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
  const [icon, setIcon] = useState(initial?.iconOrType ?? "pill");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <BottomSheet
      title={initial ? "Edit supplement" : "Add supplement"}
      onClose={onClose}
    >
      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-semibold text-ink">Name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={INPUT_CLS}
        />
      </label>
      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-semibold text-ink">
          Default dose
        </span>
        <input
          value={dose}
          onChange={(event) => setDose(event.target.value)}
          placeholder="30g, 1 scoop…"
          className={INPUT_CLS}
        />
      </label>
      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-semibold text-ink">
          Icon / type
        </span>
        <input
          value={icon}
          onChange={(event) => setIcon(event.target.value)}
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
                iconOrType: icon,
              });
              const payload = {
                id: initial?.id ?? crypto.randomUUID(),
                ...parsed,
              };
              const kind = initial
                ? "updateCustomSupplement"
                : "createCustomSupplement";
              const fallback: CustomSupplementPayload = {
                ...payload,
                createdAt: initial?.createdAt ?? new Date().toISOString(),
              };
              const result = await runMutation(kind, payload, fallback);
              onSave(result.data);
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
