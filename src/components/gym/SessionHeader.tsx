"use client";

import { useEffect, useState, useTransition } from "react";
import { endSession, startSession, type SessionPayload } from "@/app/actions/gym";
import { QuickActivityTrigger } from "@/components/activity/QuickActivityModal";

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

type SessionHeaderProps = {
  session: SessionPayload | null;
};

export function SessionHeader({ session }: SessionHeaderProps) {
  const [elapsed, setElapsed] = useState("0m 00s");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!session) {
      setElapsed("0m 00s");
      return;
    }

    const start = new Date(session.startTime).getTime();
    const tick = () => setElapsed(formatElapsed(Date.now() - start));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [session]);

  function handleStart() {
    startTransition(async () => {
      await startSession();
    });
  }

  function handleEnd() {
    if (!session) return;
    const confirmed = window.confirm("End this gym session?");
    if (!confirmed) return;

    startTransition(async () => {
      await endSession(session.id);
    });
  }

  if (!session) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              Gym
            </p>
            <h2 className="text-xl font-semibold text-neutral-100">
              Ready to train
            </h2>
          </div>
          <span className="rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs text-neutral-400">
            Idle
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleStart}
            disabled={isPending}
            className="flex h-14 items-center justify-center rounded-xl bg-lime-400 text-base font-semibold text-neutral-950 transition active:scale-[0.98] disabled:opacity-60"
          >
            {isPending ? "Starting…" : "Start Gym Session"}
          </button>
          <QuickActivityTrigger />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
            Gym
          </p>
          <h2 className="text-xl font-semibold text-neutral-100">
            Active Session: {elapsed}
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Live
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1.4fr_1fr]">
        <button
          type="button"
          onClick={handleEnd}
          disabled={isPending}
          className="flex h-12 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900 text-sm font-medium text-neutral-200 transition active:scale-[0.98] disabled:opacity-60"
        >
          {isPending ? "Ending…" : "End Session"}
        </button>
        <QuickActivityTrigger compact />
      </div>
    </section>
  );
}
