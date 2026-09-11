"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Dumbbell } from "lucide-react";

const TABS = [
  { href: "/", label: "Tracker", icon: Dumbbell },
  { href: "/history", label: "History", icon: Activity },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-1">
      <ul className="grid grid-cols-3 gap-1">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-lime-400 text-neutral-950"
                    : "text-neutral-400 hover:bg-neutral-800/80 hover:text-neutral-100"
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
