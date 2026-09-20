"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { PRIMARY_BTN } from "@/lib/ui";

export function ConfirmSheet({
  title,
  body,
  confirmLabel = "Delete",
  danger = true,
  pending = false,
  onClose,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <BottomSheet title={title} onClose={onClose}>
      <p className="mb-4 text-sm text-muted">{body}</p>
      <button
        type="button"
        disabled={pending}
        className={
          danger
            ? "w-full rounded-2xl border-2 border-danger/30 bg-danger-soft py-4 text-lg font-bold text-danger transition-all duration-150 hover:brightness-110 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 disabled:opacity-60"
            : `${PRIMARY_BTN} w-full bg-brand hover:bg-brand-dark`
        }
        onClick={onConfirm}
      >
        {pending ? "Working…" : confirmLabel}
      </button>
      <button
        type="button"
        disabled={pending}
        className="mt-2 min-h-11 w-full rounded-xl py-2 text-sm font-bold text-muted transition-all duration-150 hover:bg-chip hover:text-ink motion-safe:hover:scale-[1.02]"
        onClick={onClose}
      >
        Cancel
      </button>
    </BottomSheet>
  );
}
