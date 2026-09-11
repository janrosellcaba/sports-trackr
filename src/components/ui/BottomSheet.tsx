"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function BottomSheet({
  children,
  onClose,
  title,
  labelledBy = "sheet-title",
}: {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
  labelledBy?: string;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const sheet = (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? labelledBy : undefined}
        onClick={(event) => event.stopPropagation()}
        className="sheet-enter max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-paper p-6 shadow-xl sm:rounded-3xl"
      >
        <div className="mx-auto -mt-1 mb-4 h-1.5 w-10 rounded-full bg-muted/25 sm:hidden" />
        {title ? (
          <div className="mb-4 flex items-center justify-between">
            <h2 id={labelledBy} className="text-xl font-bold text-ink">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-full p-2 text-muted transition-colors duration-150 hover:bg-chip hover:text-ink"
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
