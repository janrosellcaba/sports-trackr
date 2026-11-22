"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Sparkles } from "lucide-react";
import type { TrainerLogRange } from "@/lib/trainer-log";
import {
  TRAINER_PROMPT_GOALS,
  TRAINER_PROMPT_GOAL_LABEL,
  type TrainerPromptGoal,
} from "@/lib/trainer-prompt";
import { LABEL_CLS } from "@/lib/ui";

const COPY_RANGES: { key: TrainerLogRange; label: string }[] = [
  { key: "days-30", label: "30 days" },
  { key: "days-90", label: "90 days" },
];

const ITEM_CLS =
  "flex w-full px-3 py-2.5 text-left text-sm font-medium text-ink transition-colors duration-150 hover:bg-chip";

const TRIGGER_CLS =
  "inline-flex size-9 items-center justify-center rounded-xl border border-line bg-chip text-muted transition-colors duration-150 hover:bg-chip-hover hover:text-ink disabled:pointer-events-none disabled:opacity-50";

const PROMPT_ITEMS: Record<TrainerPromptGoal, string> = {
  today: "What to do today, rest included",
  analyze: "Full review of my training",
};

type MenuKind = "json" | "prompt";

export function LogCopyMenu({
  disabled,
  onCopyJson,
  onCopyPrompt,
}: {
  disabled: boolean;
  onCopyJson: (range: TrainerLogRange) => Promise<void>;
  onCopyPrompt: (goal: TrainerPromptGoal) => Promise<void>;
}) {
  const [open, setOpen] = useState<MenuKind | null>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  function toggle(kind: MenuKind, button: HTMLButtonElement) {
    if (open === kind) {
      setOpen(null);
      return;
    }
    const rect = button.getBoundingClientRect();
    setPos({
      top: rect.bottom + 6,
      right: Math.max(12, window.innerWidth - rect.right),
    });
    setOpen(kind);
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (wrapRef.current?.contains(event.target as Node)) return;
      setOpen(null);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
    }
    function onScroll() {
      setOpen(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative flex items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={(event) => toggle("json", event.currentTarget)}
        title="Copy JSON"
        aria-label="Copy JSON"
        aria-haspopup="menu"
        aria-expanded={open === "json"}
        className={TRIGGER_CLS}
      >
        <Copy className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={(event) => toggle("prompt", event.currentTarget)}
        title="Copy AI prompt"
        aria-label="Copy AI prompt"
        aria-haspopup="menu"
        aria-expanded={open === "prompt"}
        className="ai-shine inline-flex size-9 items-center justify-center rounded-xl text-brand-text transition-transform duration-150 hover:scale-105 disabled:pointer-events-none disabled:opacity-50"
      >
        <Sparkles className="ai-sparkle relative z-10 h-4 w-4" aria-hidden="true" />
      </button>

      {open === "json" && pos ? (
        <div
          role="menu"
          aria-label="Copy range"
          style={{ top: pos.top, right: pos.right }}
          className="toast-enter card-lux fixed z-30 min-w-[11.5rem] overflow-hidden rounded-xl py-1"
        >
          {COPY_RANGES.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(null);
                void onCopyJson(item.key);
              }}
              className={ITEM_CLS}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      {open === "prompt" && pos ? (
        <div
          role="menu"
          aria-label="Copy AI prompt"
          style={{ top: pos.top, right: pos.right }}
          className="toast-enter card-lux fixed z-30 w-64 overflow-hidden rounded-xl py-1"
        >
          <p className={`${LABEL_CLS} px-3 pt-2 pb-1`}>Ask the AI to…</p>
          {TRAINER_PROMPT_GOALS.map((goal) => (
            <button
              key={goal}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(null);
                void onCopyPrompt(goal);
              }}
              className={`${ITEM_CLS} flex-col`}
            >
              <span>{TRAINER_PROMPT_GOAL_LABEL[goal]}</span>
              <span className="text-[11px] font-normal text-muted">
                {PROMPT_ITEMS[goal]}
              </span>
            </button>
          ))}
          <p className="border-t border-line px-3 pt-2 pb-2 text-[11px] text-muted">
            Includes your last 90 days and your profile.
          </p>
        </div>
      ) : null}
    </div>
  );
}
