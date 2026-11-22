"use client";

import { useEffect, useRef, useState } from "react";
import { Braces, Sparkles } from "lucide-react";
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
  "inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-chip px-3 text-xs font-bold text-muted transition-colors duration-150 hover:bg-chip-hover hover:text-ink disabled:pointer-events-none disabled:opacity-50";

type MenuKind = "json" | "prompt";

export function LogCopyMenu({
  disabled,
  onCopyJson,
  onCopyPrompt,
}: {
  disabled: boolean;
  onCopyJson: (range: TrainerLogRange) => Promise<void>;
  onCopyPrompt: (range: TrainerLogRange, goal: TrainerPromptGoal) => Promise<void>;
}) {
  const [open, setOpen] = useState<MenuKind | null>(null);
  const [promptRange, setPromptRange] = useState<TrainerLogRange>("days-90");
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
        <Braces className="h-3.5 w-3.5" aria-hidden="true" />
        JSON
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={(event) => toggle("prompt", event.currentTarget)}
        title="Copy AI prompt"
        aria-label="Copy AI prompt"
        aria-haspopup="menu"
        aria-expanded={open === "prompt"}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-brand/40 bg-brand-soft px-3 text-xs font-bold text-brand-text transition-colors duration-150 hover:border-brand hover:bg-brand/25 disabled:pointer-events-none disabled:opacity-50"
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        Prompt
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
          className="toast-enter card-lux fixed z-30 w-60 overflow-hidden rounded-xl py-2"
        >
          <p className={`${LABEL_CLS} px-3 pb-2`}>Data range</p>
          <div
            role="group"
            aria-label="Prompt range"
            className="mx-3 mb-3 grid grid-cols-2 gap-1 rounded-xl bg-chip p-1"
          >
            {COPY_RANGES.map((item) => {
              const active = promptRange === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setPromptRange(item.key)}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition-colors duration-150 ${
                    active
                      ? "bg-brand text-[color:var(--accent-fg)]"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <p className={`${LABEL_CLS} px-3 pb-1`}>Ask the AI to</p>
          {TRAINER_PROMPT_GOALS.map((goal) => (
            <button
              key={goal}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(null);
                void onCopyPrompt(promptRange, goal);
              }}
              className={ITEM_CLS}
            >
              {TRAINER_PROMPT_GOAL_LABEL[goal]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
