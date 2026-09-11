"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Dumbbell, Shield } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const TABS = [
  { href: "/", label: "Tracker", icon: Dumbbell },
  { href: "/history", label: "History", icon: Activity },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
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
    <nav className="flex items-center gap-2 rounded-2xl border border-neutral-850 bg-neutral-950/80 p-1">
      <Link
        href="/"
        aria-label="Trackr home"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-neutral-900"
      >
        <Logo compact />
      </Link>
      <ul
        className={`grid min-w-0 flex-1 gap-1 ${isAdmin ? "grid-cols-4" : "grid-cols-3"}`}
      >
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex h-11 items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition sm:gap-1.5 sm:text-sm ${
                  active
                    ? "bg-lime-400 text-neutral-950"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
