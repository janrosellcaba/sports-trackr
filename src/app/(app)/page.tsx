import type { Metadata } from "next";
import { requireUser } from "@/app/actions/auth";
import { getHomeDayState } from "@/app/actions/data";
import { HomeView } from "@/components/home/HomeView";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const state = await getHomeDayState(params.date);

  return (
    <HomeView
      key={state.date}
      today={state.today}
      date={state.date}
      gym={state.gym}
      sports={state.sports}
      supplements={state.supplements}
      recentSessions={state.recentSessions}
      recovery={state.recovery}
      muscles={state.muscles}
      customExercises={state.customExercises}
    />
  );
}
