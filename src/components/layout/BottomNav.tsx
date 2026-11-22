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
      className="relative shrink-0 bg-cream/90 backdrop-blur-xl border-t border-line [padding-bottom:env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-md px-1">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`group relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-bold transition-colors duration-150 select-none ${
                active ? "text-brand-text" : "text-muted hover:text-ink"
              }`}
            >
              <span
                className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors duration-150 ${
                  active
                    ? "bg-brand text-[color:var(--accent-fg)]"
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
