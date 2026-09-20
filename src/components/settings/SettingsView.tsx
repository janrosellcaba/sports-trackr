"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Dumbbell,
  Grid3x3,
  LifeBuoy,
  LogOut,
  Palette,
  User,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { deleteAccount, type AccountSession } from "@/app/actions/account";
import { exportMyData } from "@/app/actions/analytics";
import { importMyData, type ImportSummary } from "@/app/actions/import";
import { AppearanceView } from "@/components/settings/AppearanceView";
import { AccountSecurity } from "@/components/settings/AccountSecurity";
import { AdminPanel } from "@/components/settings/AdminPanel";
import {
  ExerciseCatalogView,
  MuscleCatalogView,
} from "@/components/settings/CatalogViews";
import { SupportView } from "@/components/settings/SupportView";
import { confirmsUsername, isAdminUser } from "@/lib/auth-logic";
import { buildExportCsv } from "@/lib/export-data";
import type { SettingsSection } from "@/lib/settings";
import { CARD_CLS, INPUT_CLS, LABEL_CLS, PAGE_TITLE, PRIMARY_BTN } from "@/lib/ui";
import type { AuthUser } from "@/lib/auth";
import type {
  CustomExercisePayload,
  MusclePayload,
} from "@/types/trackr";

export type { SettingsSection } from "@/lib/settings";
export { SETTINGS_SECTIONS } from "@/lib/settings";

const PAGES: {
  id: Exclude<SettingsSection, "menu">;
  label: string;
  hint: string;
  icon: typeof Dumbbell;
}[] = [
  {
    id: "muscles",
    label: "Muscles",
    hint: "Gym tiles",
    icon: Grid3x3,
  },
  {
    id: "exercises",
    label: "Exercises",
    hint: "Lift catalog",
    icon: Dumbbell,
  },
  {
    id: "appearance",
    label: "Appearance",
    hint: "Look & units",
    icon: Palette,
  },
  {
    id: "data",
    label: "Data",
    hint: "Export · import",
    icon: Download,
  },
  {
    id: "account",
    label: "Account",
    hint: "Security",
    icon: User,
  },
  {
    id: "support",
    label: "Support",
    hint: "Help, bug, idea",
    icon: LifeBuoy,
  },
];

export function SettingsView({
  user,
  section,
  muscles,
  customExercises,
  sessions = [],
}: {
  user: AuthUser;
  section: SettingsSection;
  muscles: MusclePayload[];
  customExercises: CustomExercisePayload[];
  sessions?: AccountSession[];
}) {
  if (section !== "menu") {
    return (
      <div className="space-y-4">
        <Link
          href="/settings"
          className="inline-flex min-h-11 items-center gap-1 rounded-lg px-1 text-sm font-bold text-muted transition-all duration-150 hover:bg-chip hover:text-ink motion-safe:hover:scale-[1.03]"
        >
          <ChevronLeft className="h-4 w-4" />
          Settings
        </Link>

        {section === "muscles" ? (
          <SectionIntro title="Muscles">
            <MuscleCatalogView initial={muscles} />
          </SectionIntro>
        ) : null}

        {section === "exercises" ? (
          <SectionIntro title="Exercises">
            <ExerciseCatalogView initial={customExercises} muscles={muscles} />
          </SectionIntro>
        ) : null}

        {section === "appearance" ? (
          <SectionIntro title="Appearance">
            <AppearanceView />
          </SectionIntro>
        ) : null}

        {section === "data" ? (
          <SectionIntro title="Data">
            <ExportSection />
            <ImportSection />
          </SectionIntro>
        ) : null}

        {section === "support" ? (
          <SectionIntro title="Support">
            <SupportView />
          </SectionIntro>
        ) : null}

        {section === "account" ? (
          <SectionIntro title="Account">
            <section className={`${CARD_CLS} p-4`}>
              <p className="font-display text-lg font-extrabold text-ink">{user.username}</p>
            </section>
            <AccountSecurity sessions={sessions} />
            <LogoutButton />
            <DangerZone user={user} />
          </SectionIntro>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className={PAGE_TITLE}>Settings</h1>

      <div className={`${CARD_CLS} overflow-hidden`}>
        {PAGES.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={`/settings/${item.id}`}
              className={`flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-chip/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 ${
                index > 0 ? "border-t border-line" : ""
              }`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-chip text-ink">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-bold text-ink">{item.label}</span>
                <span className="block text-xs text-muted">{item.hint}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
            </Link>
          );
        })}
      </div>

      {isAdminUser(user.username) ? <AdminPanel currentUserId={user.id} /> : null}

      <LogoutButton />
    </div>
  );
}

function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className={`${CARD_CLS} flex min-h-14 w-full items-center gap-3 px-4 py-4 text-left text-danger transition-colors duration-150 hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-danger/20`}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-soft">
          <LogOut className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="flex-1 text-base font-bold">Log out</span>
      </button>
    </form>
  );
}

function SectionIntro({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h1 className={PAGE_TITLE}>{title}</h1>
      {children}
    </div>
  );
}

function ExportSection() {
  const [pending, setPending] = useState<"json" | "csv" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

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
    setError(null);
    setMessage(null);
    setPending(format);
    startTransition(async () => {
      try {
        const data = await exportMyData();
        const stamp = new Date().toISOString().slice(0, 10);
        if (format === "json") {
          download(
            `trackr-export-${stamp}.json`,
            JSON.stringify(data, null, 2),
            "application/json",
          );
        } else {
          download(
            `trackr-export-${stamp}.csv`,
            buildExportCsv(data),
            "text/csv;charset=utf-8",
          );
        }
        setMessage(`${format.toUpperCase()} downloaded.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Export failed.");
      } finally {
        setPending(null);
      }
    });
  }

  return (
    <section className={`${CARD_CLS} space-y-3 p-4`}>
      <button
        type="button"
        disabled={pending != null}
        onClick={() => handleExport("json")}
        className={`${PRIMARY_BTN} w-full bg-brand py-3 text-base hover:bg-brand-dark`}
      >
        {pending === "json" ? "Exporting…" : "Export JSON"}
      </button>
      <button
        type="button"
        disabled={pending != null}
        onClick={() => handleExport("csv")}
        className="w-full rounded-2xl border border-line bg-chip py-3 text-base font-bold text-ink transition-all duration-150 hover:bg-chip-hover motion-safe:hover:scale-[1.01] disabled:opacity-60"
      >
        {pending === "csv" ? "Exporting…" : "Export CSV"}
      </button>
      {message ? (
        <p role="status" className="text-sm font-medium text-ink">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function ImportSection() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function summarize(summary: ImportSummary): string {
    const parts = [
      summary.gymDaysMerged ? `${summary.gymDaysMerged} gym days` : null,
      summary.hitsUpserted ? `${summary.hitsUpserted} muscle hits` : null,
      summary.sportsAdded ? `${summary.sportsAdded} sports` : null,
      summary.supplementsAdded ? `${summary.supplementsAdded} supplement logs` : null,
      summary.exercisesUpserted ? `${summary.exercisesUpserted} exercises` : null,
      summary.musclesCreated ? `${summary.musclesCreated} new muscles` : null,
      summary.preferencesUpdated ? "units" : null,
    ].filter(Boolean);
    if (parts.length === 0) return "Nothing new to merge.";
    return `Imported ${parts.join(", ")}.`;
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const text = await file.text();
        const result = await importMyData(text);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        setMessage(summarize(result.summary));
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Import failed.");
      }
    });
  }

  return (
    <section className={`${CARD_CLS} space-y-3 p-4`}>
      <p className={LABEL_CLS}>Import JSON</p>
      <label className="block">
        <span className="sr-only">Choose JSON export</span>
        <input
          type="file"
          accept="application/json,.json"
          disabled={pending}
          className="block w-full text-sm text-ink file:mr-3 file:rounded-xl file:border-0 file:bg-chip file:px-4 file:py-2 file:text-sm file:font-bold file:text-ink"
          onChange={(event) => {
            const file = event.target.files?.[0];
            handleFile(file);
            event.target.value = "";
          }}
        />
      </label>
      {pending ? <p className="text-sm text-muted">Importing…</p> : null}
      {message ? (
        <p role="status" className="text-sm font-medium text-ink">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
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
        Type <span className="font-mono text-ink">{user.username}</span> to delete
        everything.
      </p>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-ink">
          Type your username
        </span>
        <input
          value={confirmName}
          onChange={(event) => setConfirmName(event.target.value)}
          placeholder={user.username}
          className={INPUT_CLS}
        />
      </label>
      {dangerError ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {dangerError}
        </p>
      ) : null}
      <button
        type="button"
        disabled={isPending || !confirmsUsername(user.username, confirmName)}
        onClick={() => {
          startTransition(async () => {
            const result = await deleteAccount(confirmName);
            if (result?.error) setDangerError(result.error);
          });
        }}
        className="w-full rounded-2xl border-2 border-danger/30 bg-danger-soft py-3 text-base font-bold text-danger transition-all duration-150 hover:brightness-110 disabled:opacity-50"
      >
        {isPending ? "Deleting…" : "Delete account"}
      </button>
    </section>
  );
}
