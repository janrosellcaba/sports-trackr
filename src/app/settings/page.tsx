import { listCustomExercises, listCustomSupplements } from "@/app/actions/catalog";
import { getCurrentUser } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsView } from "@/components/settings/SettingsView";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [exercises, supplements] = await Promise.all([
    listCustomExercises(),
    listCustomSupplements(),
  ]);

  return (
    <AppShell>
      <PageHeader
        title="Settings"
        subtitle="Account, appearance, catalogs, and data."
      />
      <SettingsView
        user={user}
        customExercises={exercises}
        customSupplements={supplements}
      />
    </AppShell>
  );
}
