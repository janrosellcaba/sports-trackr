"use client";

import { useState, useTransition } from "react";
import { logout } from "@/app/actions/auth";
import { deleteAccount } from "@/app/actions/account";
import { exportMyData } from "@/app/actions/analytics";
import { useOfflineStatus } from "@/components/offline/OfflineProvider";
import { useAccentTheme } from "@/components/theme/ThemeProvider";
import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  MUSCLE_GROUP_KEYS,
  muscleGroupLabel,
  parseCustomExerciseInput,
  parseCustomSupplementInput,
} from "@/lib/catalog";
import { buildExportCsv } from "@/lib/export-data";
import { runMutation } from "@/lib/offline/mutate";
import { clearLocalUserState } from "@/lib/offline/store";
import { ACCENT_THEMES, ACCENT_THEME_IDS, type AccentThemeId } from "@/lib/theme";
import { CARD_CLS, INPUT_CLS, LABEL_CLS, PRIMARY_BTN } from "@/lib/ui";
import { confirmsUsername } from "@/lib/auth-logic";
import type { AuthUser } from "@/lib/auth";
import type {
  CustomExercisePayload,
  CustomSupplementPayload,
} from "@/types/trackr";

type SettingsViewProps = {
  user: AuthUser;
  customExercises: CustomExercisePayload[];
  customSupplements: CustomSupplementPayload[];
};

export function SettingsView({
  user,
  customExercises,
  customSupplements,
}: SettingsViewProps) {
  const { theme, setTheme } = useAccentTheme();
  const { online, pending, cacheKeys, lastSyncAt, syncNow } = useOfflineStatus();
  const [exercises, setExercises] = useState(customExercises);
  const [supplements, setSupplements] = useState(customSupplements);
  const [confirmName, setConfirmName] = useState("");
  const [dangerError, setDangerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function download(filename: string, contents: string, type: string) {
    const blob = new Blob([contents], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function handleExport(format: "json" | "csv") {
    startTransition(async () => {
      const data = await exportMyData();
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === "json") {
        download(`trackr-export-${stamp}.json`, JSON.stringify(data, null, 2), "application/json");
        return;
      }
      download(
        `trackr-export-${stamp}.csv`,
        buildExportCsv(data),
        "text/csv;charset=utf-8",
      );
    });
  }

  return (
    <div className="space-y-5">
      <section className={`${CARD_CLS} space-y-3 p-4`}>
        <p className={LABEL_CLS}>Profile & account</p>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-extrabold text-ink">{user.username}</p>
            <span
              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${
                user.role === "ADMIN"
                  ? "bg-brand-soft text-brand"
                  : "bg-chip text-muted"
              }`}
            >
              {user.role}
            </span>
          </div>
          <form
            action={async () => {
              await clearLocalUserState();
              await logout();
            }}
          >
            <button
              type="submit"
              className="rounded-xl bg-chip px-4 py-2 text-sm font-bold text-ink hover:bg-chip-hover"
            >
              Log out
            </button>
          </form>
        </div>
      </section>

      <section className={`${CARD_CLS} space-y-3 p-4`}>
        <p className={LABEL_CLS}>Theme & appearance</p>
        <p className="text-sm text-muted">
          Accent colors update buttons, dock, badges, and charts instantly.
        </p>
        <div className="grid grid-cols-1 gap-2">
          {ACCENT_THEME_IDS.map((id) => {
            const preset = ACCENT_THEMES[id];
            const active = theme.id === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id as AccentThemeId)}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                  active
                    ? "border-brand bg-brand/10"
                    : "border-line bg-cream/40 hover:border-brand/40"
                }`}
              >
                <span
                  className="h-8 w-8 rounded-full border border-white/10"
                  style={{ background: preset.primary, boxShadow: `0 0 16px ${preset.glow}` }}
                />
                <span>
                  <span className="block text-sm font-bold text-ink">
                    {preset.emoji} {preset.name}
                  </span>
                  <span className="font-mono text-[11px] text-muted">
                    {preset.primary}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <CatalogManager
        exercises={exercises}
        supplements={supplements}
        onExercisesChange={setExercises}
        onSupplementsChange={setSupplements}
      />

      <section className={`${CARD_CLS} space-y-3 p-4`}>
        <p className={LABEL_CLS}>Data management</p>
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleExport("json")}
          className={`${PRIMARY_BTN} w-full bg-brand py-3 text-base hover:bg-brand-dark`}
        >
          Export All Data (JSON)
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleExport("csv")}
          className="w-full rounded-2xl border border-line bg-chip py-3 text-base font-bold text-ink"
        >
          Export All Data (CSV)
        </button>
        <div className="rounded-xl bg-cream/80 px-3 py-3 text-sm text-muted">
          <p>
            Status:{" "}
            <span className="font-semibold text-ink">
              {online ? "Online" : "Offline"}
            </span>
          </p>
          <p>Local cache keys: {cacheKeys}</p>
          <p>Pending sync: {pending}</p>
          <p>
            Last sync:{" "}
            {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : "Never"}
          </p>
          <button
            type="button"
            onClick={() => void syncNow()}
            className="mt-2 text-xs font-bold text-brand"
          >
            Sync now
          </button>
        </div>
      </section>

      <section className={`${CARD_CLS} space-y-3 border-danger/30 p-4`}>
        <p className={LABEL_CLS}>Danger zone</p>
        <p className="text-sm text-muted">
          Permanently delete your account and every workout, set, sport, and
          supplement log. Type <span className="font-mono text-ink">{user.username}</span> to confirm.
        </p>
        <input
          value={confirmName}
          onChange={(event) => setConfirmName(event.target.value)}
          placeholder={user.username}
          className={INPUT_CLS}
        />
        {dangerError ? (
          <p className="text-sm font-medium text-danger">{dangerError}</p>
        ) : null}
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              if (!confirmsUsername(user.username, confirmName)) {
                setDangerError("Type your username to confirm account deletion.");
                return;
              }
              await clearLocalUserState();
              const result = await deleteAccount(confirmName);
              if (result?.error) setDangerError(result.error);
            });
          }}
          className="w-full rounded-2xl border-2 border-danger/30 bg-danger-soft py-3 text-base font-bold text-danger"
        >
          Delete account
        </button>
      </section>
    </div>
  );
}

function CatalogManager({
  exercises,
  supplements,
  onExercisesChange,
  onSupplementsChange,
}: {
  exercises: CustomExercisePayload[];
  supplements: CustomSupplementPayload[];
  onExercisesChange: (rows: CustomExercisePayload[]) => void;
  onSupplementsChange: (rows: CustomSupplementPayload[]) => void;
}) {
  const [sheet, setSheet] = useState<"exercise" | "supplement" | null>(null);
  const [editingExercise, setEditingExercise] = useState<CustomExercisePayload | null>(null);
  const [editingSupplement, setEditingSupplement] = useState<CustomSupplementPayload | null>(null);

  return (
    <section className={`${CARD_CLS} space-y-4 p-4`}>
      <p className={LABEL_CLS}>Custom catalogs</p>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink">Exercises</h3>
          <button
            type="button"
            onClick={() => {
              setEditingExercise(null);
              setSheet("exercise");
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
              <li key={item.id} className="flex items-center justify-between rounded-xl bg-chip px-3 py-2">
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
                      setEditingExercise(item);
                      setSheet("exercise");
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-xs font-bold text-danger"
                    onClick={async () => {
                      await runMutation("deleteCustomExercise", { id: item.id }, undefined);
                      onExercisesChange(exercises.filter((row) => row.id !== item.id));
                    }}
                  >
                    Del
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink">Supplements</h3>
          <button
            type="button"
            onClick={() => {
              setEditingSupplement(null);
              setSheet("supplement");
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
              <li key={item.id} className="flex items-center justify-between rounded-xl bg-chip px-3 py-2">
                <span className="text-sm font-medium text-ink">
                  {item.name}{" "}
                  <span className="text-muted">· {item.defaultDose}</span>
                </span>
                <span className="flex gap-2">
                  <button
                    type="button"
                    className="text-xs font-bold text-muted"
                    onClick={() => {
                      setEditingSupplement(item);
                      setSheet("supplement");
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-xs font-bold text-danger"
                    onClick={async () => {
                      await runMutation("deleteCustomSupplement", { id: item.id }, undefined);
                      onSupplementsChange(supplements.filter((row) => row.id !== item.id));
                    }}
                  >
                    Del
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {sheet === "exercise" ? (
        <ExerciseSheet
          initial={editingExercise}
          onClose={() => setSheet(null)}
          onSave={(row) => {
            onExercisesChange(
              exercises.some((item) => item.id === row.id)
                ? exercises.map((item) => (item.id === row.id ? row : item))
                : [row, ...exercises],
            );
            setSheet(null);
          }}
        />
      ) : null}

      {sheet === "supplement" ? (
        <SupplementSheet
          initial={editingSupplement}
          onClose={() => setSheet(null)}
          onSave={(row) => {
            onSupplementsChange(
              supplements.some((item) => item.id === row.id)
                ? supplements.map((item) => (item.id === row.id ? row : item))
                : [row, ...supplements],
            );
            setSheet(null);
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
    <BottomSheet title={initial ? "Edit supplement" : "Add supplement"} onClose={onClose}>
      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-semibold text-ink">Name</span>
        <input value={name} onChange={(event) => setName(event.target.value)} className={INPUT_CLS} />
      </label>
      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-semibold text-ink">Default dose</span>
        <input
          value={dose}
          onChange={(event) => setDose(event.target.value)}
          placeholder="30g, 1 scoop…"
          className={INPUT_CLS}
        />
      </label>
      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-semibold text-ink">Icon / type</span>
        <input value={icon} onChange={(event) => setIcon(event.target.value)} className={INPUT_CLS} />
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
              const kind = initial ? "updateCustomSupplement" : "createCustomSupplement";
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
