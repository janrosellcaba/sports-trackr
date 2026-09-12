"use client";

import { useState, useTransition } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { runMutation } from "@/lib/offline/mutate";
import { INK_BTN, INPUT_CLS, PRIMARY_BTN, chipClass } from "@/lib/ui";
import {
  CARDIO_TYPES,
  INTENSITY_LEVELS,
  type CardioActivityPayload,
  type CardioType,
  type IntensityLevel,
} from "@/types/trackr";

const DURATION_PRESETS = [30, 45, 60, 90, 120] as const;

const TYPE_LABELS: Record<CardioType, string> = {
  PADEL: "Padel",
  TENNIS: "Tennis",
  RUNNING: "Running",
  CYCLING: "Cycling",
  SWIMMING: "Swimming",
};

const INTENSITY_LABELS: Record<IntensityLevel, string> = {
  LOW: "Low",
  MODERATE: "Moderate",
  HIGH: "High",
};

type QuickActivityModalProps = {
  compact?: boolean;
  onLogged?: (activity: CardioActivityPayload) => void;
};

export function QuickActivityTrigger({
  compact = false,
  onLogged,
}: QuickActivityModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "w-full rounded-2xl bg-chip py-3 text-base font-bold text-ink transition-all duration-150 hover:-translate-y-0.5 hover:bg-chip-hover active:translate-y-0 select-none"
            : `${INK_BTN} w-full py-4 text-lg`
        }
      >
        Log Sport / Cardio
      </button>

      {open && (
        <QuickActivityModal
          onClose={() => setOpen(false)}
          onLogged={onLogged}
        />
      )}
    </>
  );
}

function QuickActivityModal({
  onClose,
  onLogged,
}: {
  onClose: () => void;
  onLogged?: (activity: CardioActivityPayload) => void;
}) {
  const [type, setType] = useState<CardioType>("PADEL");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [intensity, setIntensity] = useState<IntensityLevel>("MODERATE");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const id = crypto.randomUUID();
      const optimistic: CardioActivityPayload = {
        id,
        type,
        durationMinutes,
        intensity,
        notes: notes.trim() || null,
        date: new Date().toISOString(),
      };
      const result = await runMutation(
        "logCardio",
        {
          id,
          type,
          durationMinutes,
          intensity,
          notes: notes.trim() || undefined,
        },
        optimistic,
      );
      onLogged?.(result.data);
      onClose();
    });
  }

  return (
    <BottomSheet title="Log Sport / Cardio" onClose={onClose}>
      <fieldset className="mb-4">
        <legend className="mb-1 block text-sm font-semibold text-ink">
          Sport
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {CARDIO_TYPES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={chipClass(type === value)}
            >
              {TYPE_LABELS[value]}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mb-4">
        <legend className="mb-1 block text-sm font-semibold text-ink">
          Duration
        </legend>
        <div className="mb-3 flex flex-wrap gap-2">
          {DURATION_PRESETS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => setDurationMinutes(minutes)}
              className={`!rounded-full px-3.5 py-2 text-sm ${chipClass(durationMinutes === minutes)}`}
            >
              {minutes}m
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={10}
            max={180}
            step={5}
            value={durationMinutes}
            onChange={(event) =>
              setDurationMinutes(Number(event.target.value))
            }
            className="h-2 flex-1 accent-brand"
          />
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={300}
            value={durationMinutes}
            onChange={(event) =>
              setDurationMinutes(Math.max(1, Number(event.target.value) || 1))
            }
            className={`${INPUT_CLS} h-11 w-20 px-2 py-2 text-center font-mono text-sm`}
          />
          <span className="text-sm text-muted">min</span>
        </div>
      </fieldset>

      <fieldset className="mb-4">
        <legend className="mb-1 block text-sm font-semibold text-ink">
          Intensity
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {INTENSITY_LEVELS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setIntensity(value)}
              className={chipClass(intensity === value)}
            >
              {INTENSITY_LABELS[value]}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-semibold text-ink">
          Notes (optional)
        </span>
        <input
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Court 2, interval session…"
          className={INPUT_CLS}
        />
      </label>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className={`${PRIMARY_BTN} w-full bg-brand hover:bg-brand-dark`}
      >
        {isPending ? "Saving…" : "Save Activity"}
      </button>
    </BottomSheet>
  );
}
