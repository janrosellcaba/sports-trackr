import { getRecentActivities } from "@/app/actions/activities";
import { listCustomExercises, listCustomSupplements } from "@/app/actions/catalog";
import { getActiveSession, getSession } from "@/app/actions/gym";
import { getTodaySupplements } from "@/app/actions/supplements";
import { TrackerView } from "@/components/gym/TrackerView";
import { AppShell } from "@/components/layout/AppShell";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ session?: string | string[] }>;
}) {
  const params = await searchParams;
  const requestedId = Array.isArray(params.session)
    ? params.session[0]
    : params.session;

  const [activeSession, supplements, activities, customExercises, customSupplements] =
    await Promise.all([
      getActiveSession(),
      getTodaySupplements(),
      getRecentActivities(5),
      listCustomExercises(),
      listCustomSupplements(),
    ]);

  const requestedSession = requestedId ? await getSession(requestedId) : null;
  const session = requestedSession ?? activeSession;

  return (
    <AppShell>
      <TrackerView
        initialSession={session}
        initialSupplements={supplements}
        initialActivities={activities}
        customExercises={customExercises}
        customSupplements={customSupplements}
      />
    </AppShell>
  );
}
