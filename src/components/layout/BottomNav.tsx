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
      className="shrink-0 border-t border-line bg-paper/95 backdrop-blur [padding-bottom:env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-md px-1">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`group relative flex flex-1 flex-col items-center gap-1 py-2 text-xs font-bold transition-all duration-150 select-none ${
                active ? "text-brand-text" : "text-muted hover:text-ink"
              }`}
            >
              <span
                className={`flex h-7 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                  active
                    ? "scale-105 bg-brand/12"
                    : "group-hover:bg-chip/60"
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
