"use client";

import { useEffect, useRef, useState } from "react";
import { Copy } from "lucide-react";

export function AnalyticsCopyMenu({
  onCopyJson,
  onCopyAi,
}: {
  onCopyJson: () => Promise<void>;
  onCopyAi: () => Promise<void>;
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

  async function choose(action: () => Promise<void>) {
    setOpen(false);
    await action();
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        title="Copy"
        aria-label="Copy"
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex size-8 items-center justify-center rounded-xl bg-chip text-muted transition-colors duration-150 hover:bg-chip-hover hover:text-ink"
      >
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {open && pos ? (
        <div
          role="menu"
          style={{ top: pos.top, right: pos.right }}
          className="toast-enter card-lux fixed z-30 min-w-[11.5rem] overflow-hidden rounded-xl py-1"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => void choose(onCopyJson)}
            className="flex w-full px-3 py-2 text-left text-sm font-medium text-ink transition-colors duration-150 hover:bg-chip"
          >
            Raw JSON
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => void choose(onCopyAi)}
            className="flex w-full px-3 py-2 text-left text-sm font-medium text-ink transition-colors duration-150 hover:bg-chip"
          >
            AI prompt
          </button>
        </div>
      ) : null}
    </div>
  );
}
