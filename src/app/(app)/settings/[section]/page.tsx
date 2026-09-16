import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/app/actions/auth";
import { listActiveSessions } from "@/app/actions/account";
import { getCatalogState } from "@/app/actions/data";
import { SettingsView } from "@/components/settings/SettingsView";
import { SETTINGS_SECTIONS, type SettingsSection } from "@/lib/settings";

const TITLES: Record<Exclude<SettingsSection, "menu">, string> = {
  muscles: "Muscles",
  exercises: "Exercises",
  supplements: "Supplements",
  appearance: "Appearance",
  data: "Data",
  account: "Account",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  const title = TITLES[section as Exclude<SettingsSection, "menu">];
  return { title: title ?? "Settings" };
}

export default async function SettingsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!SETTINGS_SECTIONS.includes(section as Exclude<SettingsSection, "menu">)) {
    notFound();
  }
  const user = await requireUser();
  const catalog = await getCatalogState();
  const sessions =
    section === "account" ? await listActiveSessions() : [];
  return (
    <SettingsView
      user={user}
      section={section as SettingsSection}
      muscles={catalog.muscles}
      customExercises={catalog.customExercises}
      customSupplements={catalog.customSupplements}
      sessions={sessions}
    />
  );
}
