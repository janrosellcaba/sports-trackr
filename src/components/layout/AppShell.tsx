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
  SportSessionPayload,
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
  const [selectedDate, setSelectedDate] = useState(initialState.today);
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
    setSelectedDate(workout.date);
  }

  function addSport(session: SportSessionPayload) {
    setState((current) => {
      const sports = [session, ...current.sports.filter((item) => item.id !== session.id)].sort(
        (a, b) => b.date.localeCompare(a.date),
      );
      return {
        ...current,
        todaySports: sports.filter((item) => item.date === current.today),
        sports,
      };
    });
    setSelectedDate(session.date);
  }

  function setSupplementsForDate(date: string, intakes: SupplementPayload[]) {
    setState((current) => ({
      ...current,
      todaySupplements:
        date === current.today ? intakes : current.todaySupplements,
      supplements: [
        ...intakes,
        ...current.supplements.filter((item) => item.date !== date),
      ].sort((a, b) => b.date.localeCompare(a.date)),
    }));
  }

  function deleteWorkout(id: string) {
    setState((current) => ({
      ...current,
      todayWorkout: current.todayWorkout?.id === id ? null : current.todayWorkout,
      workouts: current.workouts.filter((item) => item.id !== id),
    }));
  }

  function deleteSport(id: string) {
    setState((current) => ({
      ...current,
      todaySports: current.todaySports.filter((item) => item.id !== id),
      sports: current.sports.filter((item) => item.id !== id),
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

  const dayWorkout =
    selectedDate === state.today
      ? state.todayWorkout
      : (state.workouts.find((workout) => workout.date === selectedDate) ?? null);
  const daySports = state.sports.filter((session) => session.date === selectedDate);
  const daySupplements = state.supplements.filter(
    (intake) => intake.date === selectedDate,
  );
  const recentWorkouts = state.workouts.filter(
    (workout) => workout.date !== selectedDate,
  );

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
              date={selectedDate}
              onDateChange={setSelectedDate}
              workout={dayWorkout}
              sports={daySports}
              supplements={daySupplements}
              recentWorkouts={recentWorkouts}
              customExercises={state.customExercises}
              customSupplements={state.customSupplements}
              onWorkoutChange={upsertWorkout}
              onSportLogged={addSport}
              onSportRemoved={deleteSport}
              onSupplementsChange={(intakes) =>
                setSupplementsForDate(selectedDate, intakes)
              }
            />
          )}
          {tab === "log" && (
            <LogView
              today={state.today}
              workouts={state.workouts}
              sports={state.sports}
              supplements={state.supplements}
              customExercises={state.customExercises}
              onWorkoutChange={(workout) => upsertWorkout(workout)}
              onSportLogged={addSport}
              onDeleteWorkout={deleteWorkout}
              onDeleteSport={deleteSport}
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
