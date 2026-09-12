import { listCustomSupplements } from "@/app/actions/catalog";
import { SupplementCatalogView } from "@/components/settings/CatalogViews";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function SupplementSettingsPage() {
  const supplements = await listCustomSupplements();

  return (
    <>
      <PageHeader
        backHref="/settings"
        title="Supplements"
        subtitle="Custom products and the doses you usually take."
      />
      <SupplementCatalogView initial={supplements} />
    </>
  );
}
