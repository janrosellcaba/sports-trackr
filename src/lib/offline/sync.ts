import { replayQueue } from "@/lib/offline/queue";
import { executeMutation } from "@/lib/offline/executors";
import {
  getOutbox,
  markSynced,
  replaceOutbox,
} from "@/lib/offline/store";

let syncing: Promise<{
  syncedCount: number;
  errors: number;
  pending: number;
}> | null = null;

export async function syncPendingMutations(): Promise<{
  syncedCount: number;
  errors: number;
  pending: number;
}> {
  if (syncing) return syncing;
  syncing = runSync().finally(() => {
    syncing = null;
  });
  return syncing;
}

async function runSync(): Promise<{
  syncedCount: number;
  errors: number;
  pending: number;
}> {
  if (typeof window === "undefined" || !navigator.onLine) {
    const pending = (await getOutbox()).length;
    return { syncedCount: 0, errors: 0, pending };
  }

  const items = await getOutbox();
  if (items.length === 0) {
    await markSynced();
    return { syncedCount: 0, errors: 0, pending: 0 };
  }

  const result = await replayQueue(items, executeMutation);
  const synced = new Set(result.synced);
  const latest = await getOutbox();
  const keep = latest
    .filter((item) => !synced.has(item.id))
    .map((item) => result.remaining.find((row) => row.id === item.id) ?? item);

  await replaceOutbox(keep);
  if (result.failed.length === 0) await markSynced();

  return {
    syncedCount: result.synced.length,
    errors: result.failed.length,
    pending: keep.length,
  };
}
