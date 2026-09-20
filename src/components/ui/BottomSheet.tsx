"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function BottomSheet({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const dragStart = useRef<number | null>(null);

  useEffect(() => {
    previousFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const panel = panelRef.current;
    const focusTarget =
      panel?.querySelector<HTMLElement>("input, select, textarea, button") ??
      closeRef.current;
    focusTarget?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    const siblings = Array.from(document.body.children).filter(
      (node) => node instanceof HTMLElement && !node.contains(panel),
    ) as HTMLElement[];
    for (const sibling of siblings) sibling.setAttribute("inert", "");

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      for (const sibling of siblings) sibling.removeAttribute("inert");
      previousFocus.current?.focus();
    };
  }, [onClose]);

  function onHandlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    dragStart.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onHandlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragStart.current == null) return;
    if (event.clientY - dragStart.current > 72) onClose();
    dragStart.current = null;
  }

  const sheet = (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 backdrop-blur-[3px] sm:items-center">
      <div className="absolute inset-0" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className="card-lux sheet-enter relative z-10 max-h-[min(90dvh,100svh)] w-full max-w-md overflow-y-auto rounded-t-[1.75rem] p-6 shadow-[var(--shadow-float)] sm:rounded-[1.75rem]"
      >
        <div
          className="mx-auto -mt-1 mb-4 flex h-8 w-full items-start justify-center sm:hidden"
          onPointerDown={onHandlePointerDown}
          onPointerUp={onHandlePointerUp}
        >
          <span className="mt-1 h-1.5 w-10 rounded-full bg-muted/30" />
        </div>
        {title ? (
          <div className="mb-4 flex items-center justify-between">
            <h2 id={titleId} className="font-display text-xl font-extrabold tracking-tight text-ink">
              {title}
            </h2>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted transition-all duration-150 hover:bg-chip hover:text-ink motion-safe:hover:scale-[1.06]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );

  if (typeof document === "undefined") return sheet;
  return createPortal(sheet, document.body);
}
