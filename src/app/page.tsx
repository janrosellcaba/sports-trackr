import { getRecentActivities } from "@/app/actions/activities";
import { getActiveSession } from "@/app/actions/gym";
import { getTodaySupplements } from "@/app/actions/supplements";
import { RecentActivities } from "@/components/activity/RecentActivities";
import { ExerciseList } from "@/components/gym/ExerciseList";
import { SessionHeader } from "@/components/gym/SessionHeader";
import { AppShell } from "@/components/layout/AppShell";
import { SupplementBar } from "@/components/supplements/SupplementBar";

export default async function Home() {
  const [session, supplements, activities] = await Promise.all([
    getActiveSession(),
    getTodaySupplements(),
    getRecentActivities(5),
  ]);

  return (
    <AppShell subtitle="Log gym, sports, and daily supplements">
      <SupplementBar intakes={supplements} />

      <SessionHeader session={session} />

      {session ? (
        <ExerciseList sessionId={session.id} exercises={session.exercises} />
      ) : (
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 px-4 py-8 text-center">
          <p className="text-sm text-neutral-400">
            Start a session to log machines, sets, and RPE with near-zero
            friction.
          </p>
        </section>
      )}

      <RecentActivities activities={activities} />
    </AppShell>
  );
}
