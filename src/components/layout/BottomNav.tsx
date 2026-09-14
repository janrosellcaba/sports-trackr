"use client";

import { BarChart3, Dumbbell, List, Settings } from "lucide-react";
import type { AppTab } from "@/types/trackr";

const ITEMS: { key: AppTab; label: string; icon: typeof Dumbbell }[] = [
  { key: "home", label: "Home", icon: Dumbbell },
  { key: "log", label: "Log", icon: List },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: Settings },
];

export function BottomNav({
  active,
  onChange,
}: {
  active: AppTab;
  onChange: (tab: AppTab) => void;
}) {
  return (
    <nav className="shrink-0 border-t border-line bg-paper/95 backdrop-blur [padding-bottom:env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md px-1">
        {ITEMS.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`group relative flex flex-1 flex-col items-center gap-1 py-2 text-xs font-bold transition-all duration-150 select-none ${
                isActive ? "text-brand" : "text-muted hover:text-ink"
              }`}
            >
              <span
                className={`flex h-7 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                  isActive
                    ? "scale-105 bg-brand/12 shadow-[0_0_16px_var(--accent-glow)]"
                    : "group-hover:bg-chip/60"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] leading-tight font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
