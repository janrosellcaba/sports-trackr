import { getCurrentUser } from "@/app/actions/auth";
import { RestTimerProvider } from "@/components/gym/RestTimer";
import { AppNav } from "@/components/layout/AppNav";
import { UserMenu } from "@/components/layout/UserMenu";
import { Logo } from "@/components/ui/Logo";
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
    <RestTimerProvider>
      <main className="min-h-screen bg-black text-neutral-100">
        <div
          className={`mx-auto flex w-full flex-col gap-6 px-4 py-6 pb-28 sm:px-6 sm:py-10 ${
            wide ? "max-w-3xl" : "max-w-lg"
          }`}
        >
          <header className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Logo />
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
    </RestTimerProvider>
  );
}
