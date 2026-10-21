"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";

export function SectionFold({
  label,
  summary,
  filled,
  children,
}: {
  label: string;
  summary: string;
  filled: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(!filled);

  if (filled && !open) {
    return (
      <button
        type="button"
        aria-expanded={false}
        onClick={() => setOpen(true)}
        className={`${CARD_CLS} flex w-full items-center gap-3 px-4 py-3.5 text-left`}
      >
        <span className={`${LABEL_CLS} shrink-0`}>{label}</span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{summary}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className="relative [&_section]:pr-14">
      {filled ? (
        <button
          type="button"
          aria-expanded
          aria-label={`Collapse ${label}`}
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 z-10 inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors duration-150 hover:bg-chip hover:text-ink"
        >
          <ChevronDown className="h-4 w-4 rotate-180" aria-hidden="true" />
        </button>
      ) : null}
      {children}
    </div>
  );
}
