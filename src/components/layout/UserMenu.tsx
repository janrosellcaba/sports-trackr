"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import type { AuthUser } from "@/lib/auth";

export function UserMenu({ user }: { user: AuthUser }) {
  const initial = (user.username[0] ?? "U").toUpperCase();

  return (
    <form action={logout} className="flex items-center gap-2">
      <span
        title={user.username}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 text-xs font-semibold text-neutral-300"
      >
        {initial}
      </span>
      <button
        type="submit"
        title="Sign out"
        aria-label="Sign out"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-800 text-neutral-500 transition hover:border-neutral-600 hover:text-neutral-200"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </form>
  );
}
