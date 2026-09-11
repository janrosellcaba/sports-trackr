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

export function AppShell({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-6 pb-24 sm:px-6 sm:py-10">
        <header className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-50">
              Trackr
            </h1>
            <p className="text-sm text-neutral-400">
              {subtitle ?? "Minimalist workout & activity logger"}
            </p>
          </div>
          <AppNav />
        </header>
        {children}
      </div>
    </main>
  );
}
