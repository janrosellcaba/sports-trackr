"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import type { AuthUser } from "@/lib/auth";

export function UserMenu({ user }: { user: AuthUser }) {
  const initial = (user.username[0] ?? "U").toUpperCase();

  return (
    <form action={logout} className="flex items-center gap-1.5">
      <span
        title={user.username}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-chip text-xs font-bold text-ink"
      >
        {initial}
      </span>
      <button
        type="submit"
        title="Sign out"
        aria-label="Sign out"
        className="rounded-full p-2.5 text-muted transition-all duration-150 hover:bg-chip hover:text-ink active:scale-90"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </form>
  );
}
