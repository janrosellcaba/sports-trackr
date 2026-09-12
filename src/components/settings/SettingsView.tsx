"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Database,
  Dumbbell,
  Palette,
  Pill,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { clearLocalUserState } from "@/lib/offline/store";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";
import type { AuthUser } from "@/lib/auth";

const MENU: {
  href: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone?: "danger";
}[] = [
  {
    href: "/settings/appearance",
    title: "Appearance",
    subtitle: "Light, dark, and accent color",
    icon: Palette,
  },
  {
    href: "/settings/exercises",
    title: "Exercises",
    subtitle: "Custom movements in your catalog",
    icon: Dumbbell,
  },
  {
    href: "/settings/supplements",
    title: "Supplements",
    subtitle: "Custom supplements and default doses",
    icon: Pill,
  },
  {
    href: "/settings/data",
    title: "Data",
    subtitle: "Export, cache, and sync status",
    icon: Database,
  },
  {
    href: "/settings/danger",
    title: "Danger zone",
    subtitle: "Permanently delete your account",
    icon: AlertTriangle,
    tone: "danger",
  },
];

export function SettingsView({ user }: { user: AuthUser }) {
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

      <nav className="space-y-2" aria-label="Settings sections">
        {MENU.map((item) => {
          const Icon = item.icon;
          const danger = item.tone === "danger";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${CARD_CLS} flex items-center gap-3 p-4 transition hover:border-brand/40 ${
                danger ? "border-danger/30" : ""
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  danger ? "bg-danger-soft text-danger" : "bg-chip text-ink"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-sm font-bold ${
                    danger ? "text-danger" : "text-ink"
                  }`}
                >
                  {item.title}
                </span>
                <span className="block text-sm text-muted">{item.subtitle}</span>
              </span>
              <span className="text-lg font-bold text-muted" aria-hidden>
                →
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
