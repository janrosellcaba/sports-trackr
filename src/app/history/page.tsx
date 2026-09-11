import { getWorkoutHistory } from "@/app/actions/analytics";
import { HistoryFeed } from "@/components/history/HistoryFeed";
import { AppShell } from "@/components/layout/AppShell";

export default async function HistoryPage() {
  const history = await getWorkoutHistory(30);

  return (
    <AppShell subtitle="Past gym sessions and sports activities">
      <div className="space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">
          History
        </h2>
        <p className="text-sm text-neutral-400">
          Expand a gym session for full set details. Delete mistakes anytime.
        </p>
      </div>

      <HistoryFeed
        sessions={history.sessions}
        activities={history.activities}
      />
    </AppShell>
  );
}
