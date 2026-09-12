"use client";

import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { clearLocalUserState } from "@/lib/offline/store";
import type { AuthUser } from "@/lib/auth";

export function UserMenu({ user }: { user: AuthUser }) {
  const initial = (user.username[0] ?? "U").toUpperCase();

  return (
    <div className="flex items-center gap-1">
      <Link
        href="/settings"
        title="Settings"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-chip text-xs font-bold text-ink transition-colors hover:bg-chip-hover"
      >
        {initial}
      </Link>
      <Link
        href="/settings"
        title="Settings"
        aria-label="Settings"
        className="rounded-full p-2.5 text-muted transition-all duration-150 hover:bg-chip hover:text-ink active:scale-90"
      >
        <Settings className="h-5 w-5" />
      </Link>
      <form
        action={async () => {
          await clearLocalUserState();
          await logout();
        }}
      >
        <button
          type="submit"
          title="Sign out"
          aria-label="Sign out"
          className="rounded-full p-2.5 text-muted transition-all duration-150 hover:bg-chip hover:text-ink active:scale-90"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
