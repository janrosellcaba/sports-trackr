"use client";

import { useState, useTransition } from "react";
import { deleteAccount } from "@/app/actions/account";
import { confirmsUsername } from "@/lib/auth-logic";
import { clearLocalUserState } from "@/lib/offline/store";
import { CARD_CLS, INPUT_CLS, LABEL_CLS } from "@/lib/ui";
import type { AuthUser } from "@/lib/auth";

export function DangerZoneView({ user }: { user: AuthUser }) {
  const [confirmName, setConfirmName] = useState("");
  const [dangerError, setDangerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <section className={`${CARD_CLS} space-y-3 border-danger/30 p-4`}>
      <p className={LABEL_CLS}>Delete account</p>
      <p className="text-sm text-muted">
        Permanently delete your account and every workout, set, sport, and
        supplement log. Type{" "}
        <span className="font-mono text-ink">{user.username}</span> to confirm.
      </p>
      <input
        value={confirmName}
        onChange={(event) => setConfirmName(event.target.value)}
        placeholder={user.username}
        className={INPUT_CLS}
      />
      {dangerError ? (
        <p className="text-sm font-medium text-danger">{dangerError}</p>
      ) : null}
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            if (!confirmsUsername(user.username, confirmName)) {
              setDangerError("Type your username to confirm account deletion.");
              return;
            }
            await clearLocalUserState();
            const result = await deleteAccount(confirmName);
            if (result?.error) setDangerError(result.error);
          });
        }}
        className="w-full rounded-2xl border-2 border-danger/30 bg-danger-soft py-3 text-base font-bold text-danger"
      >
        Delete account
      </button>
    </section>
  );
}
