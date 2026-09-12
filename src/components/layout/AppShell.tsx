import { getCurrentUser } from "@/app/actions/auth";
import { RestTimerProvider } from "@/components/gym/RestTimer";
import { AppNav } from "@/components/layout/AppNav";
import { PageEnter } from "@/components/layout/PageEnter";
import { UserMenu } from "@/components/layout/UserMenu";
import { OfflineBanner } from "@/components/offline/OfflineProvider";
import { Logo } from "@/components/ui/Logo";
import { isAdminUser } from "@/lib/auth";

export async function AppShell({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  const user = await getCurrentUser();

  return (
    <RestTimerProvider>
      <div className="fixed inset-0 flex h-[100dvh] max-h-[100dvh] flex-col bg-cream">
        <header className="shrink-0 border-b border-line bg-paper/90 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <Logo />
            {user ? <UserMenu user={user} /> : null}
          </div>
        </header>
        <OfflineBanner />

        <main className="flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
          <div
            className={`mx-auto px-5 pt-6 pb-6 ${
              wide ? "max-w-md lg:max-w-6xl" : "max-w-md"
            }`}
          >
            <PageEnter>{children}</PageEnter>
          </div>
        </main>

        <AppNav isAdmin={user ? isAdminUser(user) : false} />
      </div>
    </RestTimerProvider>
  );
}
