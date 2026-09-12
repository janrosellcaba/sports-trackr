import { AppearanceView } from "@/components/settings/AppearanceView";
import { PageHeader } from "@/components/ui/PageHeader";

export default function AppearanceSettingsPage() {
  return (
    <>
      <PageHeader
        backHref="/settings"
        title="Appearance"
        subtitle="Light or dark, plus an accent color."
      />
      <AppearanceView />
    </>
  );
}
