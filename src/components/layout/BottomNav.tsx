"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Dumbbell, List, Settings } from "lucide-react";

const ITEMS = [
  { href: "/", key: "home", label: "Home", icon: Dumbbell },
  { href: "/log", key: "log", label: "Log", icon: List },
  { href: "/analytics", key: "analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", key: "settings", label: "Settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="relative shrink-0 bg-paper/80 backdrop-blur-xl before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[var(--color-line)] before:to-transparent [padding-bottom:env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-md px-1">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`group relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-bold transition-all duration-150 select-none ${
                active ? "text-brand-text" : "text-muted hover:text-ink motion-safe:hover:scale-[1.04]"
              }`}
            >
              <span
                className={`flex h-8 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                  active
                    ? "bg-brand text-[color:var(--accent-fg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_18px_var(--accent-glow)]"
                    : "group-hover:bg-chip/70"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-[11px] leading-tight font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
