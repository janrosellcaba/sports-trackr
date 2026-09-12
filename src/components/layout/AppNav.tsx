"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Dumbbell, Settings, Shield } from "lucide-react";

const TABS = [
  { href: "/", label: "Tracker", icon: Dumbbell },
  { href: "/history", label: "History", icon: Activity },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

const ADMIN_TAB = {
  href: "/admin",
  label: "Admin",
  icon: Shield,
} as const;

export function AppNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const tabs = isAdmin ? [...TABS, ADMIN_TAB] : TABS;

  return (
    <nav className="shrink-0 border-t border-line bg-paper/95 backdrop-blur [padding-bottom:env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md px-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              onClick={() => navigator.vibrate?.(8)}
              className={`group relative flex flex-1 flex-col items-center gap-1 py-2 text-xs font-bold transition-all duration-150 select-none ${
                active ? "text-brand" : "text-muted hover:text-ink"
              }`}
            >
              <span
                className={`flex h-7 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                  active
                    ? "scale-105 bg-brand/12 shadow-[0_0_16px_var(--accent-glow)]"
                    : "group-hover:bg-chip/60"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] leading-tight font-medium">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
