import { requireUser } from "@/app/actions/auth";
import { AppChrome } from "@/components/layout/AppChrome";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return <AppChrome user={user}>{children}</AppChrome>;
}
