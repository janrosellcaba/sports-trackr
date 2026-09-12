import {
  deserializeQueue,
  serializeQueue,
  type QueuedMutation,
} from "@/lib/offline/queue";
import { ACCENT_STORAGE_KEY, COLOR_MODE_STORAGE_KEY } from "@/lib/theme";

const DB_NAME = "trackr_offline_db";
const DB_VERSION = 1;
const STORE_CACHE = "cache";
const STORE_OUTBOX = "outbox";
const STORE_META = "meta";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
        db.createObjectStore(STORE_OUTBOX, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function completeTx(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () =>
      reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
}

export async function saveToCache(key: string, data: unknown): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_CACHE, "readwrite");
    tx.objectStore(STORE_CACHE).put({ key, data, updatedAt: Date.now() });
    await completeTx(tx);
  } catch {
    // Storage can be blocked in private mode.
  }
}

export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_CACHE, "readonly");
      const req = tx.objectStore(STORE_CACHE).get(key);
      req.onsuccess = () =>
        resolve(req.result ? (req.result.data as T) : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function mergeTrackerCache(
  patch: Record<string, unknown>,
): Promise<void> {
  const current = (await getFromCache<Record<string, unknown>>("tracker")) ?? {};
  await saveToCache("tracker", { ...current, ...patch });
}

export async function enqueueOutbox(item: QueuedMutation): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_OUTBOX, "readwrite");
    tx.objectStore(STORE_OUTBOX).put(item);
    await completeTx(tx);
  } catch (error) {
    console.error("Failed to enqueue offline mutation:", error);
  }
}

export async function getOutbox(): Promise<QueuedMutation[]> {
  try {
    const db = await openDb();
    const rows = await new Promise<QueuedMutation[]>((resolve) => {
      const tx = db.transaction(STORE_OUTBOX, "readonly");
      const req = tx.objectStore(STORE_OUTBOX).getAll();
      req.onsuccess = () => resolve((req.result as QueuedMutation[]) || []);
      req.onerror = () => resolve([]);
    });
    return deserializeQueue(serializeQueue(rows));
  } catch {
    return [];
  }
}

export async function dequeueOutbox(id: string): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_OUTBOX, "readwrite");
    tx.objectStore(STORE_OUTBOX).delete(id);
    await completeTx(tx);
  } catch (error) {
    console.error("Failed to dequeue mutation:", error);
  }
}

export async function replaceOutbox(items: QueuedMutation[]): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_OUTBOX, "readwrite");
    const store = tx.objectStore(STORE_OUTBOX);
    store.clear();
    for (const item of items) store.put(item);
    await completeTx(tx);
  } catch (error) {
    console.error("Failed to replace outbox:", error);
  }
}

export async function getStorageStatus(): Promise<{
  cacheKeys: number;
  pendingMutations: number;
  lastSyncAt: number | null;
}> {
  try {
    const db = await openDb();
    const cacheKeys = await new Promise<number>((resolve) => {
      const tx = db.transaction(STORE_CACHE, "readonly");
      const req = tx.objectStore(STORE_CACHE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });
    const pendingMutations = (await getOutbox()).length;
    const lastSyncAt = await new Promise<number | null>((resolve) => {
      const tx = db.transaction(STORE_META, "readonly");
      const req = tx.objectStore(STORE_META).get("lastSyncAt");
      req.onsuccess = () =>
        resolve(typeof req.result?.value === "number" ? req.result.value : null);
      req.onerror = () => resolve(null);
    });
    return { cacheKeys, pendingMutations, lastSyncAt };
  } catch {
    return { cacheKeys: 0, pendingMutations: 0, lastSyncAt: null };
  }
}

export async function markSynced(at = Date.now()): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_META, "readwrite");
    tx.objectStore(STORE_META).put({ key: "lastSyncAt", value: at });
    await completeTx(tx);
  } catch {
    // ignore
  }
}

export async function clearOfflineData(): Promise<void> {
  try {
    if (typeof window === "undefined" || !("indexedDB" in window)) return;
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  } catch {
    // ignore
  }
}

export async function clearLocalUserState(): Promise<void> {
  await clearOfflineData();
  try {
    localStorage.removeItem(ACCENT_STORAGE_KEY);
    localStorage.removeItem(COLOR_MODE_STORAGE_KEY);
  } catch {
    // ignore
  }
}
