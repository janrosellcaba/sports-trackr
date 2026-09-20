"use client";

import { useState, useTransition } from "react";
import { Shield } from "lucide-react";
import {
  deleteUserAsAdmin,
  listAdminUsers,
  type AdminUserRow,
} from "@/app/actions/admin";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/calculations";
import { CARD_CLS, DANGER_BTN, LABEL_CLS } from "@/lib/ui";

function formatDay(value: string | null): string {
  return value ? formatDisplayDate(value) : "—";
}

export function AdminPanel({ currentUserId }: { currentUserId: string }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState<AdminUserRow | null>(null);

  function load() {
    setError(null);
    startTransition(async () => {
      try {
        setRows(await listAdminUsers());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load users.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          load();
        }}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-muted transition-all duration-150 hover:bg-chip hover:text-ink motion-safe:hover:scale-[1.04]"
      >
        <Shield className="h-4 w-4" aria-hidden="true" />
        Admin
      </button>

      {open ? (
        <BottomSheet
          title="Admin"
          onClose={() => {
            setOpen(false);
            setPendingDelete(null);
          }}
        >
          {pendingDelete ? (
            <div className="space-y-3">
              <p className="text-sm text-muted">
                Permanently delete{" "}
                <span className="font-semibold text-ink">{pendingDelete.username}</span>{" "}
                and every gym, sport, and supplement log.
              </p>
              {error ? (
                <p role="alert" className="text-sm font-medium text-danger">
                  {error}
                </p>
              ) : null}
              <button
                type="button"
                disabled={pending}
                className="w-full rounded-2xl border-2 border-danger/30 bg-danger-soft py-4 text-lg font-bold text-danger transition-all duration-150 hover:brightness-110 disabled:opacity-60"
                onClick={() => {
                  const target = pendingDelete;
                  startTransition(async () => {
                    const result = await deleteUserAsAdmin(target.id);
                    if (result.error) {
                      setError(result.error);
                      return;
                    }
                    setRows((current) => current.filter((row) => row.id !== target.id));
                    setPendingDelete(null);
                    setError(null);
                  });
                }}
              >
                {pending ? "Deleting…" : "Delete account"}
              </button>
              <button
                type="button"
                disabled={pending}
                className="min-h-11 w-full rounded-xl py-2 text-sm font-bold text-muted transition-all duration-150 hover:bg-chip hover:text-ink"
                onClick={() => {
                  setPendingDelete(null);
                  setError(null);
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <p className="mb-3 text-sm text-muted">
                {pending && rows.length === 0
                  ? "Loading…"
                  : `${rows.length} registered user${rows.length === 1 ? "" : "s"}.`}
              </p>
              {error ? (
                <p role="alert" className="mb-3 text-sm font-medium text-danger">
                  {error}
                </p>
              ) : null}
              <ul className="space-y-3">
                {rows.map((row) => (
                  <li key={row.id} className={`${CARD_CLS} p-3`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-ink">
                          {row.username}
                          {row.id === currentUserId ? (
                            <span className="ml-2 text-xs font-medium text-muted">you</span>
                          ) : null}
                        </p>
                        <p className={LABEL_CLS}>
                          Joined {formatDisplayDateTime(row.createdAt)}
                        </p>
                      </div>
                      {row.id === currentUserId ? null : (
                        <button
                          type="button"
                          disabled={pending}
                          className={DANGER_BTN}
                          onClick={() => {
                            setError(null);
                            setPendingDelete(row);
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted">
                      <div>
                        Gym days{" "}
                        <span className="font-semibold text-ink">{row.gymDays}</span>
                      </div>
                      <div>
                        Sports <span className="font-semibold text-ink">{row.sports}</span>
                      </div>
                      <div>
                        Supplements{" "}
                        <span className="font-semibold text-ink">{row.supplements}</span>
                      </div>
                      <div>
                        Devices{" "}
                        <span className="font-semibold text-ink">{row.sessions}</span>
                      </div>
                      <div className="col-span-2">
                        Last gym {formatDay(row.lastGymDate)}
                        {" · "}
                        last sport {formatDay(row.lastSportDate)}
                      </div>
                      <div className="col-span-2">
                        Last supplement {formatDay(row.lastSupplementDate)}
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            </>
          )}
        </BottomSheet>
      ) : null}
    </>
  );
}
