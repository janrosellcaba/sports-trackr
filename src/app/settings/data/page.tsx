import { DataView } from "@/components/settings/DataView";
import { PageHeader } from "@/components/ui/PageHeader";

export default function DataSettingsPage() {
  return (
    <>
      <PageHeader
        backHref="/settings"
        title="Data"
        subtitle="Export your logs and check local sync."
      />
      <DataView />
    </>
  );
}
