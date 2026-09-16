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
  GymSessionPayload,
  MusclePayload,
  SportSessionPayload,
  SupplementPayload,
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

  function upsertGym(
    session: GymSessionPayload | null,
    date: string,
    options?: { keepDate?: boolean },
  ) {
    if (!session) {
      setState((current) => ({
        ...current,
        todayGym: date === current.today ? null : current.todayGym,
        gymSessions: current.gymSessions.filter((item) => item.date !== date),
      }));
      return;
    }
    setState((current) => {
      const gymSessions = [
        session,
        ...current.gymSessions.filter(
          (item) => item.id !== session.id && item.date !== session.date,
        ),
      ].sort((a, b) => b.date.localeCompare(a.date));
      return {
        ...current,
        todayGym: session.date === current.today ? session : current.todayGym,
        gymSessions,
      };
    });
    if (!options?.keepDate) setSelectedDate(session.date);
  }

  function upsertSport(
    session: SportSessionPayload,
    options?: { keepDate?: boolean },
  ) {
    setState((current) => {
      const sports = [
        session,
        ...current.sports.filter((item) => item.id !== session.id),
      ].sort((a, b) => b.date.localeCompare(a.date));
      return {
        ...current,
        todaySports: sports.filter((item) => item.date === current.today),
        sports,
      };
    });
    if (!options?.keepDate) setSelectedDate(session.date);
  }

  function upsertSupplement(intake: SupplementPayload) {
    setState((current) => {
      const exists = current.supplements.some((item) => item.id === intake.id);
      const supplements = exists
        ? current.supplements.map((item) => (item.id === intake.id ? intake : item))
        : [intake, ...current.supplements];
      const sorted = [...supplements].sort((a, b) => b.date.localeCompare(a.date));
      return {
        ...current,
        todaySupplements: sorted.filter((item) => item.date === current.today),
        supplements: sorted,
      };
    });
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

  function deleteGym(id: string) {
    setState((current) => ({
      ...current,
      todayGym: current.todayGym?.id === id ? null : current.todayGym,
      gymSessions: current.gymSessions.filter((item) => item.id !== id),
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

  function setMuscles(rows: MusclePayload[]) {
    setState((current) => ({ ...current, muscles: rows }));
  }

  function setCustomExercises(rows: CustomExercisePayload[]) {
    setState((current) => ({ ...current, customExercises: rows }));
  }

  function upsertExercise(row: CustomExercisePayload) {
    setState((current) => ({
      ...current,
      customExercises: [
        row,
        ...current.customExercises.filter((item) => item.id !== row.id),
      ].sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }

  function setCustomSupplements(rows: CustomSupplementPayload[]) {
    setState((current) => ({ ...current, customSupplements: rows }));
  }

  const dayGym =
    selectedDate === state.today
      ? state.todayGym
      : (state.gymSessions.find((session) => session.date === selectedDate) ?? null);
  const daySports = state.sports.filter((session) => session.date === selectedDate);
  const daySupplements = state.supplements.filter(
    (intake) => intake.date === selectedDate,
  );
  const recentSessions = state.gymSessions.filter(
    (session) => session.date !== selectedDate,
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
              gym={dayGym}
              sports={daySports}
              supplements={daySupplements}
              recentSessions={recentSessions}
              muscles={state.muscles}
              customExercises={state.customExercises}
              customSupplements={state.customSupplements}
              onGymChange={(session) => upsertGym(session, selectedDate)}
              onSportLogged={upsertSport}
              onSportRemoved={deleteSport}
              onSupplementsChange={(intakes) =>
                setSupplementsForDate(selectedDate, intakes)
              }
              onExerciseChange={upsertExercise}
            />
          )}
          {tab === "log" && (
            <LogView
              today={state.today}
              gymSessions={state.gymSessions}
              sports={state.sports}
              supplements={state.supplements}
              muscles={state.muscles}
              onGymChange={(session, date) =>
                upsertGym(session, date, { keepDate: true })
              }
              onSportLogged={(session) => upsertSport(session, { keepDate: true })}
              onSupplementUpsert={upsertSupplement}
              onDeleteGym={deleteGym}
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
              muscles={state.muscles}
              customExercises={state.customExercises}
              customSupplements={state.customSupplements}
              onMusclesChange={setMuscles}
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
