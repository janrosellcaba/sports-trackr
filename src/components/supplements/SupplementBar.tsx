"use client";

import { useMemo, useTransition } from "react";
import { deleteSupplement, logSupplement } from "@/app/actions/supplements";
import type { SupplementPayload, SupplementType } from "@/types/trackr";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";

const QUICK_LOGS: {
  type: SupplementType;
  label: string;
  amountGrams?: number;
  scoops?: number;
}[] = [
  {
    type: "WHEY_PROTEIN",
    label: "+ 1 Scoop Whey",
    scoops: 1,
    amountGrams: 30,
  },
  {
    type: "PRE_WORKOUT",
    label: "+ Pre-Workout",
    scoops: 1,
  },
  {
    type: "CREATINE",
    label: "+ Creatine",
    amountGrams: 5,
  },
];

const TYPE_LABELS: Record<SupplementType, string> = {
  WHEY_PROTEIN: "Whey",
  PRE_WORKOUT: "Pre-workout",
  CREATINE: "Creatine",
};

type SupplementBarProps = {
  intakes: SupplementPayload[];
};

export function SupplementBar({ intakes }: SupplementBarProps) {
  const [isPending, startTransition] = useTransition();

  const summary = useMemo(() => {
    const byType = {
      WHEY_PROTEIN: [] as SupplementPayload[],
      PRE_WORKOUT: [] as SupplementPayload[],
      CREATINE: [] as SupplementPayload[],
    };

    for (const intake of intakes) {
      byType[intake.type].push(intake);
    }

    return byType;
  }, [intakes]);

  function handleQuickLog(
    type: SupplementType,
    amountGrams?: number,
    scoops?: number,
  ) {
    startTransition(async () => {
      await logSupplement({ type, amountGrams, scoops });
    });
  }

  function handleUndoLatest(type: SupplementType) {
    const latest = summary[type][0];
    if (!latest) return;

    startTransition(async () => {
      await deleteSupplement(latest.id);
    });
  }

  return (
    <section className={`${CARD_CLS} space-y-3 p-4`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={LABEL_CLS}>Today</p>
          <h2 className="text-base font-bold text-ink">Supplements</h2>
        </div>
        <span className="text-xs font-medium text-muted">
          {intakes.length === 0 ? "Nothing logged" : `${intakes.length} logged`}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {summary.PRE_WORKOUT.length > 0 && (
          <StatusBadge
            label="✓ Pre-workout taken"
            onUndo={() => handleUndoLatest("PRE_WORKOUT")}
            disabled={isPending}
          />
        )}
        {summary.WHEY_PROTEIN.length > 0 && (
          <StatusBadge
            label={`Whey: ${totalWheyGrams(summary.WHEY_PROTEIN)}g logged`}
            onUndo={() => handleUndoLatest("WHEY_PROTEIN")}
            disabled={isPending}
          />
        )}
        {summary.CREATINE.length > 0 && (
          <StatusBadge
            label={`✓ Creatine ${totalCreatineGrams(summary.CREATINE)}g`}
            onUndo={() => handleUndoLatest("CREATINE")}
            disabled={isPending}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {QUICK_LOGS.map((item) => (
          <button
            key={item.type}
            type="button"
            disabled={isPending}
            onClick={() =>
              handleQuickLog(item.type, item.amountGrams, item.scoops)
            }
            className="flex h-12 items-center justify-center rounded-xl bg-chip text-sm font-bold text-ink transition-all duration-150 hover:bg-chip-hover active:scale-[0.98] disabled:opacity-60"
          >
            {item.label}
          </button>
        ))}
      </div>

      {intakes.length > 0 && (
        <ul className="space-y-1.5 border-t border-line pt-3">
          {intakes.map((intake) => (
            <li
              key={intake.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="font-medium text-ink">
                {TYPE_LABELS[intake.type]}
                {intake.scoops != null ? ` · ${intake.scoops} scoop` : ""}
                {intake.amountGrams != null ? ` · ${intake.amountGrams}g` : ""}
              </span>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await deleteSupplement(intake.id);
                  })
                }
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

function totalWheyGrams(intakes: SupplementPayload[]): number {
  return intakes.reduce((sum, intake) => {
    if (intake.amountGrams != null) return sum + intake.amountGrams;
    if (intake.scoops != null) return sum + intake.scoops * 30;
    return sum;
  }, 0);
}

function totalCreatineGrams(intakes: SupplementPayload[]): number {
  return intakes.reduce((sum, intake) => sum + (intake.amountGrams ?? 0), 0);
}

function StatusBadge({
  label,
  onUndo,
  disabled,
}: {
  label: string;
  onUndo: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onUndo}
      disabled={disabled}
      title="Tap to undo latest"
      className="rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand transition-colors duration-150 hover:bg-danger-soft hover:text-danger disabled:opacity-50"
    >
      {label}
    </button>
  );
}
