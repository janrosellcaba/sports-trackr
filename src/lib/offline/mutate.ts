import {
  OUTBOX_EVENT,
  createQueuedMutation,
  isRetryableMutationError,
  type MutationKind,
} from "@/lib/offline/queue";
import { enqueueOutbox } from "@/lib/offline/store";
import { executeMutation } from "@/lib/offline/executors";

function notifyOutbox() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OUTBOX_EVENT));
  }
}

function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export async function runMutation<T>(
  kind: MutationKind,
  payload: Record<string, unknown>,
  fallback: T,
): Promise<{ data: T; queued: boolean }> {
  if (!isOffline()) {
    try {
      const data = (await executeMutation(kind, payload)) as T;
      return { data, queued: false };
    } catch (error) {
      if (!isRetryableMutationError(error)) {
        throw error;
      }
      const queued = createQueuedMutation(kind, payload);
      await enqueueOutbox(queued);
      notifyOutbox();
      return { data: fallback, queued: true };
    }
  }

  const queued = createQueuedMutation(kind, payload);
  await enqueueOutbox(queued);
  notifyOutbox();
  return { data: fallback, queued: true };
}
