"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { Logo } from "@/components/ui/Logo";
import { ServiceWorkerRegister } from "@/components/offline/ServiceWorkerRegister";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
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
      <div className="app-shell fixed inset-0 flex h-[100dvh] max-h-[100dvh] flex-col">
        <header className="relative shrink-0 bg-paper/70 px-5 py-3.5 backdrop-blur-xl [padding-top:max(0.9rem,env(safe-area-inset-top))] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-[var(--color-line)] after:to-transparent">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/"
              className="min-w-0 rounded-lg transition-transform duration-150 motion-safe:hover:scale-[1.03] focus:outline-none focus:ring-4 focus:ring-brand/20"
            >
              <Logo />
            </Link>
            <p className="max-w-[40%] truncate rounded-full bg-chip/80 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
              {user.username}
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
          <div
            className={`mx-auto px-5 pt-7 pb-8 ${
              wide ? "max-w-md lg:max-w-6xl" : "max-w-md"
            }`}
          >
            {children}
          </div>
        </main>

        <BottomNav />
        <ServiceWorkerRegister />
      </div>
    </ThemeProvider>
  );
}
