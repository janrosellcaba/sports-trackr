"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createSport,
  deleteSportCatalog,
  moveSport,
  updateSportCatalog,
} from "@/app/actions/sports";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { useLatestProps } from "@/lib/use-latest-props";
import {
  SPORT_FIELD_OPTIONS,
  sportFieldLabel,
  type SportField,
} from "@/lib/sports";
import {
  CARD_CLS,
  DANGER_BTN,
  GHOST_BTN,
  INPUT_CLS,
  PRIMARY_BTN,
  chipClass,
} from "@/lib/ui";
import type { SportCatalogPayload } from "@/types/trackr";

export function SportCatalogView({ initial }: { initial: SportCatalogPayload[] }) {
  const router = useRouter();
  const [sports, setSports] = useLatestProps(initial);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<SportCatalogPayload | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SportCatalogPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function commit(rows: SportCatalogPayload[]) {
    setSports(rows);
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
          Add
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      {sports.length === 0 ? (
        <p className="text-sm text-muted">None yet.</p>
      ) : (
        <ul className="divide-y divide-line">
          {sports.map((item, index) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{item.name}</span>
                <span className="block truncate text-xs text-muted">
                  {item.fields.map((field) => sportFieldLabel(field)).join(" · ")}
                </span>
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
                        commit(await moveSport(item.id, "up"));
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
                  disabled={pendingId != null || index === sports.length - 1}
                  className={GHOST_BTN}
                  onClick={() => {
                    setError(null);
                    setPendingId(item.id);
                    startTransition(async () => {
                      try {
                        commit(await moveSport(item.id, "down"));
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
        <SportSheet
          initial={editing}
          onClose={() => setSheetOpen(false)}
          onSave={(row) => {
            commit(
              [...sports.filter((item) => item.id !== row.id), row].sort(
                (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
              ),
            );
            setSheetOpen(false);
          }}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmSheet
          title={`Delete ${pendingDelete.name}?`}
          body="Remove it from the list. Logged sessions have to go first."
          confirmLabel="Delete sport"
          pending={pendingId === pendingDelete.id}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => {
            const target = pendingDelete;
            setError(null);
            setPendingId(target.id);
            startTransition(async () => {
              try {
                await deleteSportCatalog(target.id);
                commit(sports.filter((row) => row.id !== target.id));
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

function SportSheet({
  initial,
  onClose,
  onSave,
}: {
  initial: SportCatalogPayload | null;
  onClose: () => void;
  onSave: (row: SportCatalogPayload) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [fields, setFields] = useState<SportField[]>(initial?.fields ?? ["durationMinutes", "effort"]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(field: SportField) {
    setFields((current) =>
      current.includes(field) ? current.filter((item) => item !== field) : [...current, field],
    );
  }

  return (
    <BottomSheet title={initial ? `Edit ${initial.name}` : "New sport"} onClose={onClose}>
      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-semibold text-ink">Name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Climbing"
          className={INPUT_CLS}
        />
      </label>
      <fieldset className="mb-4">
        <legend className="mb-2 text-sm font-semibold text-ink">Inputs</legend>
        <div className="flex flex-wrap gap-2">
          {SPORT_FIELD_OPTIONS.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={fields.includes(item.key)}
              onClick={() => toggle(item.key)}
              className={chipClass(fields.includes(item.key))}
            >
              {item.label}
            </button>
          ))}
        </div>
      </fieldset>
      {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}
      <button
        type="button"
        disabled={pending}
        className={`${PRIMARY_BTN} w-full bg-brand hover:bg-brand-dark`}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              const row = initial
                ? await updateSportCatalog({ id: initial.id, name, fields })
                : await createSport({ name, fields });
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
