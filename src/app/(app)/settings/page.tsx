import type { Metadata } from "next";
import { requireUser } from "@/app/actions/auth";
import { getCatalogState } from "@/app/actions/data";
import { SettingsView } from "@/components/settings/SettingsView";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const catalog = await getCatalogState();
  return (
    <SettingsView
      user={user}
      section="menu"
      muscles={catalog.muscles}
      customExercises={catalog.customExercises}
    />
  );
}
