"use client";

import { useMemo, useTransition } from "react";
import Link from "next/link";
import { useOfflineStatus } from "@/components/offline/OfflineProvider";
import { mergeSupplementCatalog, parseDoseHint } from "@/lib/catalog";
import { runMutation } from "@/lib/offline/mutate";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";
import type {
  CustomSupplementPayload,
  SupplementPayload,
} from "@/types/trackr";

type SupplementBarProps = {
  intakes: SupplementPayload[];
  customSupplements: CustomSupplementPayload[];
  onChange: (intakes: SupplementPayload[]) => void;
};

export function SupplementBar({
  intakes,
  customSupplements,
  onChange,
}: SupplementBarProps) {
  const [isPending, startTransition] = useTransition();
  const { refreshStatus } = useOfflineStatus();
  const catalog = useMemo(
    () => mergeSupplementCatalog(customSupplements),
    [customSupplements],
  );

  function handleQuickLog(item: (typeof catalog)[number]) {
    const dose = parseDoseHint(item.defaultDose);
    const id = crypto.randomUUID();
    const optimistic: SupplementPayload = {
      id,
      type: item.type === "CUSTOM" ? "CUSTOM" : (item.type as SupplementPayload["type"]),
      label: item.name,
      catalogId: item.source === "custom" ? item.id : null,
      amountGrams: item.amountGrams ?? dose.amountGrams ?? null,
      scoops: item.scoops ?? dose.scoops ?? null,
      notes: null,
      date: new Date().toISOString(),
    };

    startTransition(async () => {
      const result = await runMutation(
        "logSupplement",
        {
          id,
          type: optimistic.type,
          label: item.name,
          catalogId: optimistic.catalogId,
          amountGrams: optimistic.amountGrams ?? undefined,
          scoops: optimistic.scoops ?? undefined,
        },
        optimistic,
      );
      onChange([result.data, ...intakes]);
      await refreshStatus();
    });
  }

  function handleUndo(id: string) {
    startTransition(async () => {
      await runMutation("deleteSupplement", { id }, undefined);
      onChange(intakes.filter((item) => item.id !== id));
      await refreshStatus();
    });
  }

  if (catalog.length === 0 && intakes.length === 0) {
    return null;
  }

  return (
    <section className={`${CARD_CLS} space-y-3 p-4`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={LABEL_CLS}>Today</p>
          <h2 className="text-base font-bold text-ink">Supplements</h2>
        </div>
        <Link
          href="/settings/supplements"
          className="text-xs font-bold text-muted hover:text-brand"
        >
          Catalog
        </Link>
      </div>

      {catalog.length > 0 ? (
        <div
          className={`grid grid-cols-1 gap-2 ${
            catalog.length > 3 ? "sm:grid-cols-2" : "sm:grid-cols-3"
          }`}
        >
          {catalog.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={isPending}
              onClick={() => handleQuickLog(item)}
              className="flex h-12 items-center justify-center rounded-xl bg-chip text-sm font-bold text-ink transition-all duration-150 hover:bg-chip-hover active:scale-[0.98] disabled:opacity-60"
            >
              + {item.name}
            </button>
          ))}
        </div>
      ) : null}

      {intakes.length > 0 && (
        <ul className="space-y-1.5 border-t border-line pt-3">
          {intakes.map((intake) => (
            <li
              key={intake.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="font-medium text-ink">
                {intake.label}
                {intake.scoops != null
                  ? ` · ${intake.scoops} scoop${intake.scoops === 1 ? "" : "s"}`
                  : ""}
                {intake.amountGrams != null ? ` · ${intake.amountGrams}g` : ""}
              </span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleUndo(intake.id)}
                className="rounded-md px-2 py-1 text-xs font-semibold text-muted hover:text-danger disabled:opacity-50"
              >
                Undo
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
