"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { Logo } from "@/components/ui/Logo";
import { ServiceWorkerRegister } from "@/components/offline/ServiceWorkerRegister";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { UnitsProvider } from "@/components/units/UnitsProvider";
import type { AuthUser } from "@/lib/auth";

export function AppChrome({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const wide = pathname.startsWith("/analytics");

  return (
    <ThemeProvider
      key={`${user.accentTheme}-${user.colorMode}`}
      initialTheme={user.accentTheme}
      initialColorMode={user.colorMode}
    >
      <UnitsProvider
        key={`${user.massUnit}-${user.distanceUnit}`}
        massUnit={user.massUnit}
        distanceUnit={user.distanceUnit}
      >
      <div className="fixed inset-0 flex h-[100dvh] max-h-[100dvh] flex-col bg-cream">
        <header className="shrink-0 border-b border-line bg-paper/90 px-5 py-4 backdrop-blur [padding-top:max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/"
              className="min-w-0 rounded-lg transition-transform duration-150 motion-safe:hover:scale-[1.03] focus:outline-none focus:ring-4 focus:ring-brand/20"
            >
              <Logo />
            </Link>
            <p className="truncate text-sm font-bold text-muted">{user.username}</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
          <div
            className={`mx-auto px-5 pt-6 pb-6 ${
              wide ? "max-w-md lg:max-w-6xl" : "max-w-md"
            }`}
          >
            {children}
          </div>
        </main>

        <BottomNav />
        <ServiceWorkerRegister />
      </div>
      </UnitsProvider>
    </ThemeProvider>
  );
}
