export const OUTBOX_EVENT = "trackr-outbox";

export const MUTATION_KINDS = [
  "startSession",
  "createManualSession",
  "endSession",
  "updateSessionTimes",
  "addExercise",
  "addSet",
  "deleteSet",
  "deleteExercise",
  "logCardio",
  "deleteCardio",
  "deleteSession",
  "logSupplement",
  "deleteSupplement",
  "createCustomExercise",
  "updateCustomExercise",
  "deleteCustomExercise",
  "createCustomSupplement",
  "updateCustomSupplement",
  "deleteCustomSupplement",
] as const;

export type MutationKind = (typeof MUTATION_KINDS)[number];

export type QueuedMutation = {
  id: string;
  kind: MutationKind;
  payload: Record<string, unknown>;
  timestamp: number;
};

export type MutationExecutor = (
  kind: MutationKind,
  payload: Record<string, unknown>,
) => Promise<unknown>;

export function serializeQueue(items: QueuedMutation[]): string {
  return JSON.stringify(items);
}

export function deserializeQueue(raw: string): QueuedMutation[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isQueuedMutation);
  } catch {
    return [];
  }
}

export function isQueuedMutation(value: unknown): value is QueuedMutation {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<QueuedMutation>;
  return (
    typeof item.id === "string" &&
    typeof item.kind === "string" &&
    (MUTATION_KINDS as readonly string[]).includes(item.kind) &&
    typeof item.timestamp === "number" &&
    !!item.payload &&
    typeof item.payload === "object"
  );
}

export function sortQueue(items: QueuedMutation[]): QueuedMutation[] {
  return [...items].sort((a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id));
}

export type ReplayResult = {
  synced: string[];
  failed: { id: string; error: string }[];
  remaining: QueuedMutation[];
};

const ID_KEYS = [
  "id",
  "sessionId",
  "exerciseLogId",
  "setId",
  "catalogId",
] as const;

export function applyIdMap(
  payload: Record<string, unknown>,
  idMap: Record<string, string>,
): Record<string, unknown> {
  const next = { ...payload };
  for (const key of ID_KEYS) {
    const value = next[key];
    if (typeof value === "string" && idMap[value]) {
      next[key] = idMap[value];
    }
  }
  return next;
}

export function recordCreatedId(
  idMap: Record<string, string>,
  payload: Record<string, unknown>,
  result: unknown,
): void {
  if (!result || typeof result !== "object" || !("id" in result)) return;
  const resultId = (result as { id: unknown }).id;
  if (typeof resultId !== "string" || typeof payload.id !== "string") return;
  if (payload.id !== resultId) idMap[payload.id] = resultId;
}

export function isRetryableMutationError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return true;
  }
  if (error instanceof TypeError) return true;
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("offline") ||
    message.includes("load failed") ||
    message.includes("fetch failed")
  );
}

export async function replayQueue(
  items: QueuedMutation[],
  execute: MutationExecutor,
): Promise<ReplayResult> {
  const ordered = sortQueue(items);
  const synced: string[] = [];
  const failed: { id: string; error: string }[] = [];
  const idMap: Record<string, string> = {};

  for (let index = 0; index < ordered.length; index += 1) {
    const item = ordered[index];
    const payload = applyIdMap(item.payload, idMap);
    try {
      const result = await execute(item.kind, payload);
      recordCreatedId(idMap, item.payload, result);
      synced.push(item.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync failed";
      failed.push({ id: item.id, error: message });
      return {
        synced,
        failed,
        remaining: ordered.slice(index).map((queued) => ({
          ...queued,
          payload: applyIdMap(queued.payload, idMap),
        })),
      };
    }
  }

  return { synced, failed, remaining: [] };
}

export function createQueuedMutation(
  kind: MutationKind,
  payload: Record<string, unknown>,
  id = crypto.randomUUID(),
  timestamp = Date.now(),
): QueuedMutation {
  return { id, kind, payload, timestamp };
}
