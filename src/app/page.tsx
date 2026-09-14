import { getExerciseNames, getAnalyticsSummary } from "@/app/actions/analytics";
import { requireUser } from "@/app/actions/auth";
import { getAppState } from "@/app/actions/data";
import { AppShell } from "@/components/layout/AppShell";

export default async function Home() {
  const user = await requireUser();
  const [state, analytics, exerciseNames] = await Promise.all([
    getAppState(),
    getAnalyticsSummary(30),
    getExerciseNames(),
  ]);

  return (
    <AppShell
      user={user}
      initialState={state}
      initialAnalytics={analytics}
      exerciseNames={exerciseNames}
    />
  );
}
