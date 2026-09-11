import { getWorkoutHistory } from "@/app/actions/analytics";
import { HistoryFeed } from "@/components/history/HistoryFeed";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function HistoryPage() {
  const history = await getWorkoutHistory(30);

  return (
    <AppShell>
      <PageHeader
        title="History"
        subtitle="Expand a gym session for full set details. Delete mistakes anytime."
      />

      <HistoryFeed
        sessions={history.sessions}
        activities={history.activities}
      />
    </AppShell>
  );
}
