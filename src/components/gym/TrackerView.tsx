"use client";

import { useEffect, useState } from "react";
import { RecentActivities } from "@/components/activity/RecentActivities";
import { ExerciseList } from "@/components/gym/ExerciseList";
import { useRestTimer } from "@/components/gym/RestTimer";
import { SessionHeader } from "@/components/gym/SessionHeader";
import { SupplementBar } from "@/components/supplements/SupplementBar";
import { getFromCache, saveToCache } from "@/lib/offline/store";
import { CARD_CLS } from "@/lib/ui";
import type {
  CardioActivityPayload,
  CustomExercisePayload,
  CustomSupplementPayload,
  SessionPayload,
  SupplementPayload,
} from "@/types/trackr";

type TrackerCache = {
  session: SessionPayload | null;
  supplements?: SupplementPayload[];
  activities?: CardioActivityPayload[];
};

type TrackerViewProps = {
  initialSession: SessionPayload | null;
  initialSupplements: SupplementPayload[];
  initialActivities: CardioActivityPayload[];
  customExercises: CustomExercisePayload[];
  customSupplements: CustomSupplementPayload[];
};

export function TrackerView({
  initialSession,
  initialSupplements,
  initialActivities,
  customExercises,
  customSupplements,
}: TrackerViewProps) {
  const restTimer = useRestTimer();
  const [session, setSession] = useState(initialSession);
  const [supplements, setSupplements] = useState(initialSupplements);
  const [activities, setActivities] = useState(initialActivities);
  const [hydrated, setHydrated] = useState(Boolean(initialSession));

  useEffect(() => {
    if (initialSession) {
      setSession(initialSession);
      setHydrated(true);
      return;
    }

    let cancelled = false;
    void (async () => {
      const online = typeof navigator === "undefined" || navigator.onLine;
      const cached = await getFromCache<TrackerCache>("tracker");
      if (cancelled) return;
      if (cached?.session && (!online || cached.session.mode === "MANUAL")) {
        setSession(cached.session);
      } else {
        setSession(null);
      }
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [initialSession]);

  useEffect(() => {
    setSupplements(initialSupplements);
  }, [initialSupplements]);

  useEffect(() => {
    setActivities(initialActivities);
  }, [initialActivities]);

  useEffect(() => {
    if (!hydrated) return;
    void saveToCache("tracker", {
      session,
      supplements,
      activities,
      customExercises,
      customSupplements,
    });
  }, [
    hydrated,
    session,
    supplements,
    activities,
    customExercises,
    customSupplements,
  ]);

  const live = Boolean(session && !session.endTime && session.mode !== "MANUAL");

  useEffect(() => {
    if (!live) restTimer?.stop();
  }, [live, restTimer]);

  return (
    <>
      <SupplementBar
        intakes={supplements}
        customSupplements={customSupplements}
        onChange={setSupplements}
      />

      <SessionHeader
        session={session}
        onSessionChange={setSession}
        onActivityLogged={(activity) =>
          setActivities((current) => [activity, ...current].slice(0, 5))
        }
      />

      {session ? (
        <ExerciseList
          session={session}
          onSessionChange={setSession}
          customExercises={customExercises}
          enableRestTimer={live}
        />
      ) : (
        <section className={`${CARD_CLS} border-dashed px-4 py-8 text-center`}>
          <p className="text-sm text-muted">
            Start a live session or log a past workout to add machines and sets.
          </p>
        </section>
      )}

      <RecentActivities activities={activities} onChange={setActivities} />
    </>
  );
}
