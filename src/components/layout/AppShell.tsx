import { getCurrentUser } from "@/app/actions/auth";
import { AppNav } from "@/components/layout/AppNav";
import { UserMenu } from "@/components/layout/UserMenu";
import { isAdminUser } from "@/lib/auth";

export async function AppShell({
  children,
  subtitle,
  wide = false,
}: {
  children: React.ReactNode;
  subtitle?: string;
  wide?: boolean;
}) {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div
        className={`mx-auto flex w-full flex-col gap-6 px-4 py-6 pb-24 sm:px-6 sm:py-10 ${
          wide ? "max-w-3xl" : "max-w-lg"
        }`}
      >
        <header className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-neutral-50">
                Trackr
              </h1>
              <p className="text-sm text-neutral-400">
                {subtitle ?? "Minimalist workout & activity logger"}
              </p>
            </div>
            {user ? <UserMenu user={user} /> : null}
          </div>
          <AppNav isAdmin={user ? isAdminUser(user) : false} />
        </header>
        {children}
      </div>
    </main>
  );
}
