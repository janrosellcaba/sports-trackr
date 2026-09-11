"use client";

import { useEffect, useState, useTransition } from "react";
import { endSession, startSession } from "@/app/actions/gym";
import type { SessionPayload } from "@/types/trackr";
import { QuickActivityTrigger } from "@/components/activity/QuickActivityModal";
import { LABEL_CLS, PRIMARY_BTN } from "@/lib/ui";

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
      <section className="space-y-3">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-paper p-6 text-center shadow-sm">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand/5 via-transparent to-transparent" />
          <p className={`relative ${LABEL_CLS}`}>Gym</p>
          <p className="relative mt-2 text-3xl font-extrabold tracking-tight text-ink">
            Ready to train
          </p>
        </div>

        <button
          type="button"
          onClick={handleStart}
          disabled={isPending}
          className={`${PRIMARY_BTN} w-full bg-brand hover:bg-brand-dark shadow-sm`}
        >
          {isPending ? "Starting…" : "Start Gym Session"}
        </button>
        <QuickActivityTrigger />
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-paper p-6 text-center shadow-sm">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand/5 via-transparent to-transparent" />
        <div className="relative mb-2 flex items-center justify-center gap-2">
          <p className={LABEL_CLS}>Active session</p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-bold text-brand">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
            Live
          </span>
        </div>
        <p className="relative font-mono text-4xl font-extrabold tracking-tight text-brand tabular-nums">
          {elapsed}
        </p>
      </div>

      <button
        type="button"
        onClick={handleEnd}
        disabled={isPending}
        className="w-full rounded-2xl border-2 border-danger/25 bg-danger-soft py-4 text-lg font-bold text-danger transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-danger/40 hover:shadow-md active:translate-y-0 disabled:opacity-60 select-none"
      >
        {isPending ? "Ending…" : "End Session"}
      </button>
      <QuickActivityTrigger compact />
    </section>
  );
}
