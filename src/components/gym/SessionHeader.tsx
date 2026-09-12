"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { QuickActivityTrigger } from "@/components/activity/QuickActivityModal";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { runMutation } from "@/lib/offline/mutate";
import { mergeTrackerCache } from "@/lib/offline/store";
import { useOfflineStatus } from "@/components/offline/OfflineProvider";
import {
  isStaleOpenSession,
  parseSessionTimes,
  toDatetimeLocalValue,
} from "@/lib/session-times";
import { INPUT_CLS, LABEL_CLS, PRIMARY_BTN } from "@/lib/ui";
import type { CardioActivityPayload, SessionPayload } from "@/types/trackr";

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
  onSessionChange: (session: SessionPayload | null) => void;
  onActivityLogged?: (activity: CardioActivityPayload) => void;
};

export function SessionHeader({
  session,
  onSessionChange,
  onActivityLogged,
}: SessionHeaderProps) {
  const router = useRouter();
  const { refreshStatus } = useOfflineStatus();
  const [elapsed, setElapsed] = useState("0m 00s");
  const [isPending, startTransition] = useTransition();
  const [manualOpen, setManualOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");
  const [error, setError] = useState<string | null>(null);

  const live = Boolean(session && !session.endTime && session.mode !== "MANUAL");

  useEffect(() => {
    if (!session || !live) {
      setElapsed("0m 00s");
      return;
    }
    const start = new Date(session.startTime).getTime();
    const tick = () => setElapsed(formatElapsed(Date.now() - start));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [session, live]);

  useEffect(() => {
    if (!session) return;
    setStartLocal(toDatetimeLocalValue(session.startTime));
    setEndLocal(
      session.endTime
        ? toDatetimeLocalValue(session.endTime)
        : toDatetimeLocalValue(new Date()),
    );
  }, [session]);

  async function persistSession(
    next: SessionPayload | null,
    options?: { queued?: boolean },
  ) {
    onSessionChange(next);
    await mergeTrackerCache({ session: next });
    await refreshStatus();
    if (options?.queued) return;
    if (next?.mode === "MANUAL") {
      router.replace(`/?session=${next.id}`);
    } else if (!next) {
      router.replace("/");
    }
    router.refresh();
  }

  function handleStart() {
    const id = crypto.randomUUID();
    const startTime = new Date().toISOString();
    const optimistic: SessionPayload = {
      id,
      startTime,
      endTime: null,
      notes: null,
      mode: "LIVE",
      exercises: [],
    };
    startTransition(async () => {
      const result = await runMutation("startSession", { id, startTime }, optimistic);
      await persistSession(result.data, { queued: result.queued });
    });
  }

  function handleEndClick() {
    if (!session) return;
    if (isStaleOpenSession(session.startTime) || session.mode === "MANUAL") {
      setEndLocal(toDatetimeLocalValue(new Date()));
      setEndOpen(true);
      return;
    }
    if (!window.confirm("End this gym session?")) return;
    finishSession(new Date().toISOString());
  }

  function finishSession(endTime: string) {
    if (!session) return;
    const optimistic: SessionPayload = { ...session, endTime };
    startTransition(async () => {
      const result = await runMutation(
        "endSession",
        { sessionId: session.id, endTime },
        optimistic,
      );
      setEndOpen(false);
      await persistSession(result.data.endTime ? null : result.data, {
        queued: result.queued,
      });
    });
  }

  function saveTimes() {
    if (!session) return;
    const times = parseSessionTimes({
      startTime: startLocal,
      endTime: live ? null : endLocal,
    });
    if (times.error) {
      setError(times.error);
      return;
    }
    const startUnchanged =
      startLocal === toDatetimeLocalValue(session.startTime);
    const startIso = startUnchanged
      ? session.startTime
      : times.start.toISOString();
    const optimistic: SessionPayload = {
      ...session,
      startTime: startIso,
      endTime: times.end?.toISOString() ?? null,
    };
    startTransition(async () => {
      const result = await runMutation(
        "updateSessionTimes",
        {
          sessionId: session.id,
          startTime: startIso,
          endTime: times.end?.toISOString() ?? null,
        },
        optimistic,
      );
      setError(null);
      await persistSession(result.data, { queued: result.queued });
    });
  }

  if (!session) {
    return (
      <section className="space-y-3">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-paper p-6 text-center shadow-sm">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand/10 via-transparent to-transparent" />
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
        <button
          type="button"
          onClick={() => {
            setStartLocal(toDatetimeLocalValue(new Date(Date.now() - 60 * 60 * 1000)));
            setEndLocal(toDatetimeLocalValue(new Date()));
            setError(null);
            setManualOpen(true);
          }}
          className="w-full rounded-2xl border border-line bg-chip py-4 text-lg font-bold text-ink transition-all duration-150 hover:-translate-y-0.5 hover:bg-chip-hover"
        >
          Log Past Workout
        </button>
        <QuickActivityTrigger onLogged={onActivityLogged} />
        {manualOpen ? (
          <ManualSessionSheet
            startLocal={startLocal}
            endLocal={endLocal}
            error={error}
            pending={isPending}
            onStartChange={setStartLocal}
            onEndChange={setEndLocal}
            onClose={() => setManualOpen(false)}
            onSave={() => {
              const times = parseSessionTimes({
                startTime: startLocal,
                endTime: endLocal,
              });
              if (times.error) {
                setError(times.error);
                return;
              }
              const id = crypto.randomUUID();
              const optimistic: SessionPayload = {
                id,
                startTime: times.start.toISOString(),
                endTime: times.end!.toISOString(),
                notes: null,
                mode: "MANUAL",
                exercises: [],
              };
              startTransition(async () => {
                const result = await runMutation(
                  "createManualSession",
                  {
                    id,
                    startTime: times.start.toISOString(),
                    endTime: times.end!.toISOString(),
                  },
                  optimistic,
                );
                setManualOpen(false);
                await persistSession(result.data, { queued: result.queued });
              });
            }}
          />
        ) : null}
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-paper p-6 text-center shadow-sm">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand/10 via-transparent to-transparent" />
        <div className="relative mb-2 flex items-center justify-center gap-2">
          <p className={LABEL_CLS}>
            {live ? "Active session" : "Manual session"}
          </p>
          {live ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-bold text-brand">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
              Live
            </span>
          ) : (
            <span className="rounded-full bg-chip px-2.5 py-0.5 text-[11px] font-bold text-muted">
              Retrospective
            </span>
          )}
        </div>
        <p className="relative font-mono text-4xl font-extrabold tracking-tight text-brand tabular-nums">
          {live
            ? elapsed
            : `${parseSessionTimes({ startTime: session.startTime, endTime: session.endTime }).durationMinutes}m`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">Start</span>
          <input
            type="datetime-local"
            value={startLocal}
            onChange={(event) => setStartLocal(event.target.value)}
            className={INPUT_CLS}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">End</span>
          <input
            type="datetime-local"
            value={endLocal}
            onChange={(event) => setEndLocal(event.target.value)}
            disabled={live}
            className={INPUT_CLS}
          />
        </label>
      </div>
      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
      <button
        type="button"
        onClick={saveTimes}
        disabled={isPending}
        className="w-full rounded-2xl border border-line bg-chip py-3 text-sm font-bold text-ink"
      >
        Save times
      </button>

      {live ? (
        <button
          type="button"
          onClick={handleEndClick}
          disabled={isPending}
          className="w-full rounded-2xl border-2 border-danger/25 bg-danger-soft py-4 text-lg font-bold text-danger transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-danger/40 hover:shadow-md active:translate-y-0 disabled:opacity-60 select-none"
        >
          {isPending ? "Ending…" : "End Session"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void persistSession(null)}
          className="w-full rounded-2xl border border-line py-3 text-sm font-bold text-muted"
        >
          Done editing
        </button>
      )}
      <QuickActivityTrigger compact onLogged={onActivityLogged} />

      {endOpen ? (
        <BottomSheet title="Adjust End Time" onClose={() => setEndOpen(false)}>
          <p className="mb-3 text-sm text-muted">
            This session was left open. Set when it actually finished.
          </p>
          <input
            type="datetime-local"
            value={endLocal}
            onChange={(event) => setEndLocal(event.target.value)}
            className={`${INPUT_CLS} mb-4`}
          />
          <button
            type="button"
            onClick={() => {
              const times = parseSessionTimes({
                startTime: session.startTime,
                endTime: endLocal,
              });
              if (times.error) {
                setError(times.error);
                return;
              }
              finishSession(times.end!.toISOString());
            }}
            className={`${PRIMARY_BTN} w-full bg-brand hover:bg-brand-dark`}
          >
            Save and close
          </button>
        </BottomSheet>
      ) : null}
    </section>
  );
}

function ManualSessionSheet({
  startLocal,
  endLocal,
  error,
  pending,
  onStartChange,
  onEndChange,
  onClose,
  onSave,
}: {
  startLocal: string;
  endLocal: string;
  error: string | null;
  pending: boolean;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <BottomSheet title="Log Past Workout" onClose={onClose}>
      <label className="mb-3 block">
        <span className="mb-1 block text-sm font-semibold text-ink">Started</span>
        <input
          type="datetime-local"
          value={startLocal}
          onChange={(event) => onStartChange(event.target.value)}
          className={INPUT_CLS}
        />
      </label>
      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-semibold text-ink">Finished</span>
        <input
          type="datetime-local"
          value={endLocal}
          onChange={(event) => onEndChange(event.target.value)}
          className={INPUT_CLS}
        />
      </label>
      {error ? <p className="mb-3 text-sm font-medium text-danger">{error}</p> : null}
      <button
        type="button"
        disabled={pending}
        onClick={onSave}
        className={`${PRIMARY_BTN} w-full bg-brand hover:bg-brand-dark`}
      >
        {pending ? "Saving…" : "Create session"}
      </button>
    </BottomSheet>
  );
}
