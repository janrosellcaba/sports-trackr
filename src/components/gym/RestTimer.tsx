"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { REST_PRESETS, formatRestTime } from "@/lib/calculations";

type RestTimerContextValue = {
  active: boolean;
  remaining: number;
  preset: number;
  start: (seconds?: number) => void;
  adjust: (delta: number) => void;
  stop: () => void;
  setPreset: (seconds: number) => void;
};

const RestTimerContext = createContext<RestTimerContextValue | null>(null);

export function useRestTimer(): RestTimerContextValue | null {
  return useContext(RestTimerContext);
}

export function RestTimerProvider({ children }: { children: React.ReactNode }) {
  const [preset, setPreset] = useState<number>(90);
  const [remaining, setRemaining] = useState(0);
  const [active, setActive] = useState(false);

  const start = useCallback((seconds?: number) => {
    const next = seconds ?? preset;
    setRemaining(next);
    setActive(true);
  }, [preset]);

  const adjust = useCallback((delta: number) => {
    setRemaining((current) => Math.max(0, current + delta));
    setActive(true);
  }, []);

  const stop = useCallback(() => {
    setActive(false);
    setRemaining(0);
  }, []);

  useEffect(() => {
    if (!active) return;

    const id = window.setInterval(() => {
      setRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!active || remaining > 0) return;
    navigator.vibrate?.([100, 50, 100]);
    setActive(false);
  }, [active, remaining]);

  const value = useMemo(
    () => ({
      active,
      remaining,
      preset,
      start,
      adjust,
      stop,
      setPreset,
    }),
    [active, remaining, preset, start, adjust, stop],
  );

  return (
    <RestTimerContext.Provider value={value}>
      {children}
      <RestTimer />
    </RestTimerContext.Provider>
  );
}

export function RestTimer() {
  const timer = useRestTimer();
  if (!timer || (!timer.active && timer.remaining <= 0)) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex justify-center px-4">
      <div
        role="timer"
        aria-live="polite"
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-line bg-paper/95 px-2 py-1.5 shadow-xl backdrop-blur"
      >
        <div className="flex items-center gap-1 px-1">
          {REST_PRESETS.map((seconds) => (
            <button
              key={seconds}
              type="button"
              onClick={() => {
                timer.setPreset(seconds);
                timer.start(seconds);
              }}
              className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                timer.preset === seconds
                  ? "bg-brand text-[color:var(--accent-fg)]"
                  : "text-muted hover:text-ink"
              }`}
            >
              {seconds}s
            </button>
          ))}
        </div>

        <p className="min-w-[3.25rem] text-center font-mono text-lg font-bold tabular-nums text-brand">
          {formatRestTime(timer.remaining)}
        </p>

        <button
          type="button"
          onClick={() => timer.adjust(-30)}
          className="h-8 rounded-full bg-chip px-2 font-mono text-[11px] font-bold text-ink"
          aria-label="Subtract 30 seconds"
        >
          −30
        </button>
        <button
          type="button"
          onClick={() => timer.adjust(30)}
          className="h-8 rounded-full bg-chip px-2 font-mono text-[11px] font-bold text-ink"
          aria-label="Add 30 seconds"
        >
          +30
        </button>
        <button
          type="button"
          onClick={timer.stop}
          className="rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-paper"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
