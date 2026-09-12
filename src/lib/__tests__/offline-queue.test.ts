import { describe, expect, it } from "vitest";
import {
  createQueuedMutation,
  deserializeQueue,
  replayQueue,
  serializeQueue,
  type MutationExecutor,
  type QueuedMutation,
} from "@/lib/offline/queue";

const sample: QueuedMutation[] = [
  createQueuedMutation("addSet", { weight: 100, reps: 5 }, "a", 100),
  createQueuedMutation("addSet", { weight: 110, reps: 5 }, "b", 200),
];

describe("offline queue serialization", () => {
  it("round-trips queued mutations", () => {
    const raw = serializeQueue(sample);
    expect(deserializeQueue(raw)).toEqual(sample);
  });

  it("drops malformed payloads instead of throwing", () => {
    expect(deserializeQueue("{")).toEqual([]);
    expect(deserializeQueue(JSON.stringify([{ kind: "nope" }]))).toEqual([]);
  });
});

describe("replayQueue", () => {
  it("replays items in timestamp order and clears the queue on success", async () => {
    const seen: string[] = [];
    const execute: MutationExecutor = async (_kind, payload) => {
      seen.push(String(payload.weight));
    };

    const result = await replayQueue(
      [sample[1], sample[0]],
      execute,
    );

    expect(seen).toEqual(["100", "110"]);
    expect(result.synced).toEqual(["a", "b"]);
    expect(result.remaining).toEqual([]);
    expect(result.failed).toEqual([]);
  });

  it("stops on the first failure and keeps remaining items ordered", async () => {
    const execute: MutationExecutor = async (_kind, payload) => {
      if (payload.weight === 110) throw new Error("network down");
    };

    const result = await replayQueue(sample, execute);
    expect(result.synced).toEqual(["a"]);
    expect(result.failed).toEqual([{ id: "b", error: "network down" }]);
    expect(result.remaining.map((item) => item.id)).toEqual(["b"]);
  });

  it("rewrites later payloads when a create returns a different id", async () => {
    const seen: string[] = [];
    const execute: MutationExecutor = async (kind, payload) => {
      if (kind === "startSession") {
        seen.push(String(payload.id));
        return { id: "server-session" };
      }
      seen.push(String(payload.sessionId));
      return { id: "set-1" };
    };

    const result = await replayQueue(
      [
        createQueuedMutation("startSession", { id: "local-session" }, "q1", 1),
        createQueuedMutation(
          "addSet",
          { sessionId: "local-session", weight: 60, reps: 8 },
          "q2",
          2,
        ),
      ],
      execute,
    );

    expect(seen).toEqual(["local-session", "server-session"]);
    expect(result.synced).toEqual(["q1", "q2"]);
  });
});

describe("isRetryableMutationError", () => {
  it("retries network failures and not validation errors", async () => {
    const { isRetryableMutationError } = await import("@/lib/offline/queue");
    expect(isRetryableMutationError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isRetryableMutationError(new Error("Name must be at least 2 characters."))).toBe(false);
  });
});
