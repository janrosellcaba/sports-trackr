"use client";

import { useState, useTransition } from "react";
import {
  changePassword,
  revokeOtherSessions,
  revokeSession,
  type AccountSession,
} from "@/app/actions/account";
import { PasswordField } from "@/components/auth/PasswordField";
import { formatDisplayDateTime } from "@/lib/calculations";
import { CARD_CLS, LABEL_CLS, PRIMARY_BTN } from "@/lib/ui";

export function AccountSecurity({ sessions }: { sessions: AccountSession[] }) {
  return (
    <div className="space-y-3">
      <ChangePasswordForm />
      <SessionsCard sessions={sessions} />
    </div>
  );
}

function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section className={`${CARD_CLS} space-y-3 p-4`}>
      <p className={LABEL_CLS}>Password</p>
      <p className="text-sm text-muted">
        Changing it signs out every other device.
      </p>
      <form
        className="space-y-3"
        action={(formData) => {
          setError(null);
          setMessage(null);
          startTransition(async () => {
            const result = await changePassword(formData);
            if (result?.error) setError(result.error);
            else setMessage("Password updated.");
          });
        }}
      >
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-ink">
            Current password
          </span>
          <PasswordField
            name="currentPassword"
            autoComplete="current-password"
            placeholder="Current password"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-ink">
            New password
          </span>
          <PasswordField
            name="newPassword"
            autoComplete="new-password"
            minLength={8}
            placeholder="At least 8 characters"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-ink">
            Confirm new password
          </span>
          <PasswordField
            name="confirmPassword"
            autoComplete="new-password"
            minLength={8}
            placeholder="Repeat new password"
          />
        </label>
        {message ? (
          <p role="status" className="text-sm font-medium text-ink">
            {message}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className={`${PRIMARY_BTN} w-full bg-brand py-3 text-base hover:bg-brand-dark`}
        >
          {pending ? "Saving…" : "Update password"}
        </button>
      </form>
    </section>
  );
}

function SessionsCard({ sessions }: { sessions: AccountSession[] }) {
  const [rows, setRows] = useState(sessions);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const others = rows.filter((item) => !item.current).length;

  return (
    <section className={`${CARD_CLS} space-y-3 p-4`}>
      <p className={LABEL_CLS}>Signed-in devices</p>
      <ul className="space-y-2">
        {rows.length === 0 ? (
          <li className="text-sm text-muted">No active sessions.</li>
        ) : (
          rows.map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-chip px-3 py-2"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">
                  {session.current ? "This device" : "Other device"}
                </span>
                <span className="block text-xs text-muted">
                  {formatDisplayDateTime(session.createdAt)}
                </span>
              </span>
              {session.current ? (
                <span className="text-xs font-bold text-muted">Current</span>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  className="min-h-11 rounded-xl px-3 text-sm font-bold text-danger transition-all duration-150 hover:bg-danger-soft disabled:opacity-50"
                  onClick={() => {
                    setError(null);
                    startTransition(async () => {
                      const result = await revokeSession(session.id);
                      if (result?.error) setError(result.error);
                      else setRows((current) => current.filter((row) => row.id !== session.id));
                    });
                  }}
                >
                  Revoke
                </button>
              )}
            </li>
          ))
        )}
      </ul>
      {others > 0 ? (
        <button
          type="button"
          disabled={pending}
          className="w-full rounded-2xl border border-line bg-chip py-3 text-base font-bold text-ink transition-all duration-150 hover:bg-chip-hover motion-safe:hover:scale-[1.01] disabled:opacity-60"
          onClick={() => {
            setError(null);
            startTransition(async () => {
              await revokeOtherSessions();
              setRows((current) => current.filter((row) => row.current));
            });
          }}
        >
          {pending ? "Updating…" : "Log out other devices"}
        </button>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}
