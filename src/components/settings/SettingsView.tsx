"use client";

import { useState, useTransition } from "react";
import { logout } from "@/app/actions/auth";
import { deleteAccount } from "@/app/actions/account";
import { exportMyData } from "@/app/actions/analytics";
import { AppearanceView } from "@/components/settings/AppearanceView";
import {
  ExerciseCatalogView,
  SupplementCatalogView,
} from "@/components/settings/CatalogViews";
import { confirmsUsername } from "@/lib/auth-logic";
import { buildExportCsv } from "@/lib/export-data";
import { CARD_CLS, INPUT_CLS, LABEL_CLS, PRIMARY_BTN } from "@/lib/ui";
import type { AuthUser } from "@/lib/auth";
import type {
  CustomExercisePayload,
  CustomSupplementPayload,
} from "@/types/trackr";

export function SettingsView({
  user,
  customExercises,
  customSupplements,
  onExercisesChange,
  onSupplementsChange,
}: {
  user: AuthUser;
  customExercises: CustomExercisePayload[];
  customSupplements: CustomSupplementPayload[];
  onExercisesChange: (rows: CustomExercisePayload[]) => void;
  onSupplementsChange: (rows: CustomSupplementPayload[]) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className={LABEL_CLS}>Settings</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Make it yours</h1>
      </div>

      <section className={`${CARD_CLS} space-y-3 p-4`}>
        <p className={LABEL_CLS}>Account</p>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-extrabold text-ink">{user.username}</p>
            <p className="text-sm text-muted">Signed in</p>
          </div>
          <form action={() => logout()}>
            <button
              type="submit"
              className="rounded-xl bg-chip px-4 py-2 text-sm font-bold text-ink hover:bg-chip-hover"
            >
              Log out
            </button>
          </form>
        </div>
      </section>

      <AppearanceView />
      <ExerciseCatalogView initial={customExercises} onChange={onExercisesChange} />
      <SupplementCatalogView initial={customSupplements} onChange={onSupplementsChange} />
      <ExportSection />
      <DangerZone user={user} />
    </div>
  );
}

function ExportSection() {
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
        download(
          `trackr-export-${stamp}.json`,
          JSON.stringify(data, null, 2),
          "application/json",
        );
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
    <section className={`${CARD_CLS} space-y-3 p-4`}>
      <p className={LABEL_CLS}>Export</p>
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleExport("json")}
        className={`${PRIMARY_BTN} w-full bg-brand py-3 text-base hover:bg-brand-dark`}
      >
        Export JSON
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleExport("csv")}
        className="w-full rounded-2xl border border-line bg-chip py-3 text-base font-bold text-ink"
      >
        Export CSV
      </button>
    </section>
  );
}

function DangerZone({ user }: { user: AuthUser }) {
  const [confirmName, setConfirmName] = useState("");
  const [dangerError, setDangerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <section className={`${CARD_CLS} space-y-3 border-danger/30 p-4`}>
      <p className={LABEL_CLS}>Delete account</p>
      <p className="text-sm text-muted">
        Permanently delete your account and every gym, sport, and supplement log. Type{" "}
        <span className="font-mono text-ink">{user.username}</span> to confirm.
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
            const result = await deleteAccount(confirmName);
            if (result?.error) setDangerError(result.error);
          });
        }}
        className="w-full rounded-2xl border-2 border-danger/30 bg-danger-soft py-3 text-base font-bold text-danger"
      >
        Delete account
      </button>
    </section>
  );
}
