"use client";

import { useEffect, useState } from "react";

const SHOW_MS = 2800;
const LEAVE_MS = 160;

export type Notice = { id: number; text: string };

export function NoticeToast({
  notice,
  onDismissed,
}: {
  notice: Notice | null;
  onDismissed: () => void;
}) {
  const [shown, setShown] = useState<Notice | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!notice) return;
    setShown(notice);
    setLeaving(false);
    const leave = window.setTimeout(() => setLeaving(true), SHOW_MS);
    const gone = window.setTimeout(() => {
      setShown(null);
      onDismissed();
    }, SHOW_MS + LEAVE_MS);
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(gone);
    };
  }, [notice, onDismissed]);

  if (!shown) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4">
      <div
        role="status"
        className={`card-lux pointer-events-auto w-full max-w-sm rounded-2xl px-4 py-3 text-sm font-medium text-ink ${
          leaving ? "toast-leave" : "toast-enter"
        }`}
      >
        {shown.text}
      </div>
    </div>
  );
}
