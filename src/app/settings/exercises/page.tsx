import { listCustomExercises } from "@/app/actions/catalog";
import { ExerciseCatalogView } from "@/components/settings/CatalogViews";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function ExerciseSettingsPage() {
  const exercises = await listCustomExercises();

  return (
    <>
      <PageHeader
        backHref="/settings"
        title="Exercises"
        subtitle="Add movements that are missing from the built-in catalog."
      />
      <ExerciseCatalogView initial={exercises} />
    </>
  );
}
