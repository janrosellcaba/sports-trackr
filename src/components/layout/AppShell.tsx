"use client";

import { useEffect, useRef, useState } from "react";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { HomeView } from "@/components/home/HomeView";
import { BottomNav } from "@/components/layout/BottomNav";
import { LogView } from "@/components/log/LogView";
import { SettingsView } from "@/components/settings/SettingsView";
import { Logo } from "@/components/ui/Logo";
import type { AuthUser } from "@/lib/auth";
import type {
  AnalyticsSummary,
  AppState,
  AppTab,
  CustomExercisePayload,
  CustomSupplementPayload,
  SupplementPayload,
  WorkoutPayload,
} from "@/types/trackr";

export function AppShell({
  user,
  initialState,
  initialAnalytics,
  exerciseNames,
}: {
  user: AuthUser;
  initialState: AppState;
  initialAnalytics: AnalyticsSummary;
  exerciseNames: string[];
}) {
  const [tab, setTab] = useState<AppTab>("home");
  const [state, setState] = useState(initialState);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [tab]);

  function upsertWorkout(workout: WorkoutPayload | null) {
    if (!workout) return;
    setState((current) => {
      const workouts = [
        workout,
        ...current.workouts.filter(
          (item) => item.id !== workout.id && item.date !== workout.date,
        ),
      ].sort((a, b) => b.date.localeCompare(a.date));
      return {
        ...current,
        todayWorkout: workout.date === current.today ? workout : current.todayWorkout,
        workouts,
      };
    });
  }

  function setTodaySupplements(intakes: SupplementPayload[]) {
    setState((current) => ({
      ...current,
      todaySupplements: intakes,
      supplements: [
        ...intakes,
        ...current.supplements.filter((item) => item.date !== current.today),
      ],
    }));
  }

  function deleteWorkout(id: string) {
    setState((current) => ({
      ...current,
      todayWorkout: current.todayWorkout?.id === id ? null : current.todayWorkout,
      workouts: current.workouts.filter((item) => item.id !== id),
    }));
  }

  function deleteSupplement(id: string) {
    setState((current) => ({
      ...current,
      todaySupplements: current.todaySupplements.filter((item) => item.id !== id),
      supplements: current.supplements.filter((item) => item.id !== id),
    }));
  }

  function setCustomExercises(rows: CustomExercisePayload[]) {
    setState((current) => ({ ...current, customExercises: rows }));
  }

  function setCustomSupplements(rows: CustomSupplementPayload[]) {
    setState((current) => ({ ...current, customSupplements: rows }));
  }

  const recentWorkouts = state.workouts.filter((workout) => workout.date !== state.today);

  return (
    <div className="fixed inset-0 flex h-[100dvh] max-h-[100dvh] flex-col bg-cream">
      <header className="shrink-0 border-b border-line bg-paper/90 px-5 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <Logo />
          <p className="text-sm font-bold text-muted">{user.username}</p>
        </div>
      </header>

      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]"
      >
        <div
          className={`mx-auto px-5 pt-6 pb-6 ${
            tab === "analytics" ? "max-w-md lg:max-w-6xl" : "max-w-md"
          }`}
        >
          {tab === "home" && (
            <HomeView
              today={state.today}
              todayWorkout={state.todayWorkout}
              todaySupplements={state.todaySupplements}
              recentWorkouts={recentWorkouts}
              customExercises={state.customExercises}
              customSupplements={state.customSupplements}
              onWorkoutChange={upsertWorkout}
              onSupplementsChange={setTodaySupplements}
            />
          )}
          {tab === "log" && (
            <LogView
              today={state.today}
              workouts={state.workouts}
              supplements={state.supplements}
              customExercises={state.customExercises}
              onWorkoutChange={(workout) => upsertWorkout(workout)}
              onDeleteWorkout={deleteWorkout}
              onDeleteSupplement={deleteSupplement}
            />
          )}
          {tab === "analytics" && (
            <AnalyticsView
              initialSummary={initialAnalytics}
              initialNames={exerciseNames}
            />
          )}
          {tab === "settings" && (
            <SettingsView
              user={user}
              customExercises={state.customExercises}
              customSupplements={state.customSupplements}
              onExercisesChange={setCustomExercises}
              onSupplementsChange={setCustomSupplements}
            />
          )}
        </div>
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
