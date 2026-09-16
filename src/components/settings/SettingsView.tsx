"use client";

import { useEffect, useState, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Dumbbell,
  Grid3x3,
  LogOut,
  Palette,
  Pill,
  User,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { deleteAccount } from "@/app/actions/account";
import { exportMyData } from "@/app/actions/analytics";
import { AppearanceView } from "@/components/settings/AppearanceView";
import {
  ExerciseCatalogView,
  MuscleCatalogView,
  SupplementCatalogView,
} from "@/components/settings/CatalogViews";
import { confirmsUsername } from "@/lib/auth-logic";
import { buildExportCsv } from "@/lib/export-data";
import { CARD_CLS, INPUT_CLS, LABEL_CLS, PAGE_TITLE, PRIMARY_BTN } from "@/lib/ui";
import type { AuthUser } from "@/lib/auth";
import type {
  CustomExercisePayload,
  CustomSupplementPayload,
  MusclePayload,
} from "@/types/trackr";

type SettingsPage =
  | "menu"
  | "muscles"
  | "supplements"
  | "exercises"
  | "appearance"
  | "data"
  | "account";

const PAGES: {
  id: Exclude<SettingsPage, "menu">;
  label: string;
  hint: string;
  icon: typeof Pill;
}[] = [
  {
    id: "muscles",
    label: "Muscles",
    hint: "Tap targets on Home",
    icon: Grid3x3,
  },
  {
    id: "exercises",
    label: "Exercises",
    hint: "Lift catalog",
    icon: Dumbbell,
  },
  {
    id: "supplements",
    label: "Supplements",
    hint: "Tap buttons on Home",
    icon: Pill,
  },
  {
    id: "appearance",
    label: "Appearance",
    hint: "Dark, light, accent",
    icon: Palette,
  },
  {
    id: "data",
    label: "Data",
    hint: "Export JSON or CSV",
    icon: Download,
  },
  {
    id: "account",
    label: "Account",
    hint: "Username and delete",
    icon: User,
  },
];

export function SettingsView({
  user,
  muscles,
  customExercises,
  customSupplements,
  onMusclesChange,
  onExercisesChange,
  onSupplementsChange,
}: {
  user: AuthUser;
  muscles: MusclePayload[];
  customExercises: CustomExercisePayload[];
  customSupplements: CustomSupplementPayload[];
  onMusclesChange: (rows: MusclePayload[]) => void;
  onExercisesChange: (rows: CustomExercisePayload[]) => void;
  onSupplementsChange: (rows: CustomSupplementPayload[]) => void;
}) {
  const [page, setPage] = useState<SettingsPage>("menu");

  useEffect(() => {
    document.querySelector("main")?.scrollTo({ top: 0 });
  }, [page]);

  if (page !== "menu") {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setPage("menu")}
          className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" />
          Settings
        </button>

        {page === "muscles" ? (
          <SectionIntro
            title="Muscles"
            description="Tap these after a gym session. Add Calves, or split Back into Lats and Traps, whenever you want."
          >
            <MuscleCatalogView initial={muscles} onChange={onMusclesChange} />
          </SectionIntro>
        ) : null}

        {page === "supplements" ? (
          <SectionIntro
            title="Supplements"
            description="These become the tap buttons on Home. Edit dose or remove ones you don’t use."
          >
            <SupplementCatalogView
              initial={customSupplements}
              onChange={onSupplementsChange}
            />
          </SectionIntro>
        ) : null}

        {page === "exercises" ? (
          <SectionIntro
            title="Exercises"
            description="Add lifts here first. Personal records are logged from Home with + Add PR."
          >
            <ExerciseCatalogView
              initial={customExercises}
              muscles={muscles}
              onChange={onExercisesChange}
            />
          </SectionIntro>
        ) : null}

        {page === "appearance" ? (
          <SectionIntro
            title="Appearance"
            description="Dark or light, plus the accent used on buttons and charts."
          >
            <AppearanceView />
          </SectionIntro>
        ) : null}

        {page === "data" ? (
          <SectionIntro
            title="Data"
            description="Download your gym, sports, and supplement history."
          >
            <ExportSection />
          </SectionIntro>
        ) : null}

        {page === "account" ? (
          <SectionIntro
            title="Account"
            description="Signed in as this user. Deleting the account cannot be undone."
          >
            <section className={`${CARD_CLS} p-4`}>
              <p className="text-lg font-semibold text-ink">{user.username}</p>
              <p className="text-sm text-muted">Signed in</p>
            </section>
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
        <form action={() => logout()}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-chip/40"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-chip text-ink">
              <LogOut className="h-5 w-5" />
            </span>
            <span className="flex-1 text-base font-bold text-ink">Log out</span>
          </button>
        </form>
        {PAGES.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPage(item.id)}
              className="flex w-full items-center gap-3 border-t border-line px-4 py-3 text-left hover:bg-chip/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-chip text-ink">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-bold text-ink">{item.label}</span>
                <span className="block text-xs text-muted">{item.hint}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionIntro({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h1 className={PAGE_TITLE}>{title}</h1>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      {children}
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
