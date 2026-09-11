"use client";

import { useState, useTransition } from "react";
import { logCardioActivity } from "@/app/actions/activities";
import {
  CARDIO_TYPES,
  INTENSITY_LEVELS,
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
};

export function QuickActivityTrigger({
  compact = false,
}: QuickActivityModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "flex h-11 w-full items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-sm font-medium text-neutral-300 transition active:scale-[0.98] hover:border-lime-400/30 hover:text-lime-300"
            : "flex h-12 w-full items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900 text-sm font-medium text-neutral-200 transition active:scale-[0.98] hover:border-lime-400/40 hover:text-lime-300"
        }
      >
        Log Sport / Cardio
      </button>

      {open && <QuickActivityModal onClose={() => setOpen(false)} />}
    </>
  );
}

function QuickActivityModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<CardioType>("PADEL");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [intensity, setIntensity] = useState<IntensityLevel>("MODERATE");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await logCardioActivity({
        type,
        durationMinutes,
        intensity,
        notes: notes.trim() || undefined,
      });
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              Activity
            </p>
            <h3 className="text-lg font-semibold text-neutral-100">
              Log Sport / Cardio
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-800 px-3 py-2 text-sm text-neutral-400"
          >
            Close
          </button>
        </div>

        <fieldset className="mb-5 space-y-2">
          <legend className="text-xs uppercase tracking-wide text-neutral-500">
            Sport
          </legend>
          <div className="flex flex-wrap gap-2">
            {CARDIO_TYPES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                  type === value
                    ? "border-lime-400/50 bg-lime-400/15 text-lime-300"
                    : "border-neutral-800 bg-neutral-900 text-neutral-300"
                }`}
              >
                {TYPE_LABELS[value]}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mb-5 space-y-3">
          <legend className="text-xs uppercase tracking-wide text-neutral-500">
            Duration
          </legend>
          <div className="flex flex-wrap gap-2">
            {DURATION_PRESETS.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => setDurationMinutes(minutes)}
                className={`rounded-full border px-3.5 py-2 text-sm transition ${
                  durationMinutes === minutes
                    ? "border-lime-400/50 bg-lime-400/15 text-lime-300"
                    : "border-neutral-800 bg-neutral-900 text-neutral-300"
                }`}
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
              className="h-2 flex-1 accent-lime-400"
            />
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={300}
              value={durationMinutes}
              onChange={(event) =>
                setDurationMinutes(
                  Math.max(1, Number(event.target.value) || 1),
                )
              }
              className="h-11 w-20 rounded-xl border border-neutral-800 bg-neutral-900 text-center font-mono text-sm text-neutral-100 outline-none focus:border-lime-400/40"
            />
            <span className="text-sm text-neutral-500">min</span>
          </div>
        </fieldset>

        <fieldset className="mb-5 space-y-2">
          <legend className="text-xs uppercase tracking-wide text-neutral-500">
            Intensity
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {INTENSITY_LEVELS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setIntensity(value)}
                className={`h-11 rounded-xl border text-sm font-medium transition ${
                  intensity === value
                    ? "border-lime-400/50 bg-lime-400/15 text-lime-300"
                    : "border-neutral-800 bg-neutral-900 text-neutral-300"
                }`}
              >
                {INTENSITY_LABELS[value]}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="mb-5 block space-y-2">
          <span className="text-xs uppercase tracking-wide text-neutral-500">
            Notes (optional)
          </span>
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Court 2, interval session…"
            className="h-12 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 text-base text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-lime-400/40"
          />
        </label>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex h-14 w-full items-center justify-center rounded-xl bg-lime-400 text-base font-semibold text-neutral-950 transition active:scale-[0.98] disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save Activity"}
        </button>
      </div>
    </div>
  );
}
