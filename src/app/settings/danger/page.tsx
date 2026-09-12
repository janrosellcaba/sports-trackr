import { getCurrentUser } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { DangerZoneView } from "@/components/settings/DangerZoneView";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function DangerSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <PageHeader
        backHref="/settings"
        title="Danger zone"
        subtitle="This cannot be undone."
      />
      <DangerZoneView user={user} />
    </>
  );
}
