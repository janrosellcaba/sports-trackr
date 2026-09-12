"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { OUTBOX_EVENT } from "@/lib/offline/queue";
import { getOutbox, getStorageStatus } from "@/lib/offline/store";
import { syncPendingMutations } from "@/lib/offline/sync";

type OfflineContextValue = {
  online: boolean;
  pending: number;
  cacheKeys: number;
  lastSyncAt: number | null;
  refreshStatus: () => Promise<void>;
  syncNow: () => Promise<void>;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [cacheKeys, setCacheKeys] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);

  const refreshStatus = useCallback(async () => {
    const status = await getStorageStatus();
    const queue = await getOutbox();
    setPending(queue.length);
    setCacheKeys(status.cacheKeys);
    setLastSyncAt(status.lastSyncAt);
  }, []);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine) {
      await refreshStatus();
      return;
    }
    await syncPendingMutations();
    await refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    setOnline(navigator.onLine);
    void refreshStatus();

    function handleOnline() {
      setOnline(true);
      void syncNow();
    }
    function handleOffline() {
      setOnline(false);
      void refreshStatus();
    }
    function handleFocus() {
      if (navigator.onLine) void syncNow();
      else void refreshStatus();
    }

    function handleOutbox() {
      void refreshStatus();
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("focus", handleFocus);
    window.addEventListener(OUTBOX_EVENT, handleOutbox);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(OUTBOX_EVENT, handleOutbox);
    };
  }, [refreshStatus, syncNow]);

  const value = useMemo(
    () => ({ online, pending, cacheKeys, lastSyncAt, refreshStatus, syncNow }),
    [online, pending, cacheKeys, lastSyncAt, refreshStatus, syncNow],
  );

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
}

export function OfflineBanner() {
  const { online, pending } = useOfflineStatus();
  if (online && pending === 0) return null;
  return (
    <div className="shrink-0 bg-zinc-900 px-4 py-2 text-center text-xs font-semibold text-zinc-100">
      {!online
        ? "Offline mode • Changes saved locally"
        : `Syncing ${pending} change${pending === 1 ? "" : "s"}…`}
    </div>
  );
}

export function useOfflineStatus(): OfflineContextValue {
  const ctx = useContext(OfflineContext);
  if (!ctx) {
    return {
      online: true,
      pending: 0,
      cacheKeys: 0,
      lastSyncAt: null,
      refreshStatus: async () => undefined,
      syncNow: async () => undefined,
    };
  }
  return ctx;
}
