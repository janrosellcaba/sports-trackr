"use client";

import { useEffect, useRef, useState } from "react";
import { Copy } from "lucide-react";
import type { TrainerLogRange } from "@/lib/trainer-log";

const COPY_RANGES: { key: TrainerLogRange; label: string }[] = [
  { key: "sessions-30", label: "30 sessions" },
  { key: "days-30", label: "30 days" },
  { key: "days-60", label: "60 days" },
];

export function LogCopyMenu({
  disabled,
  onCopy,
}: {
  disabled: boolean;
  onCopy: (range: TrainerLogRange) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({
        top: rect.bottom + 6,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (wrapRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onScroll() {
      setOpen(false);
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

  async function choose(range: TrainerLogRange) {
    setOpen(false);
    await onCopy(range);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        title="Copy JSON"
        aria-label="Copy JSON"
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex size-8 items-center justify-center rounded-xl bg-chip text-muted transition-colors duration-150 hover:bg-chip-hover hover:text-ink disabled:pointer-events-none disabled:opacity-50"
      >
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {open && pos ? (
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
              onClick={() => void choose(item.key)}
              className="flex w-full px-3 py-2 text-left text-sm font-medium text-ink transition-colors duration-150 hover:bg-chip"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
