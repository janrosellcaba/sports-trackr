import { describe, expect, it } from "vitest";
import {
  isStaleOpenSession,
  parseSessionTimes,
  toDatetimeLocalValue,
  datetimeLocalToIso,
} from "@/lib/session-times";

describe("parseSessionTimes", () => {
  it("computes duration between start and end", () => {
    const result = parseSessionTimes({
      startTime: "2026-09-11T18:30:00.000Z",
      endTime: "2026-09-11T19:45:00.000Z",
    });
    expect(result.error).toBeUndefined();
    expect(result.durationMinutes).toBe(75);
  });

  it("rejects an end time that is before the start time", () => {
    const result = parseSessionTimes({
      startTime: "2026-09-11T19:45:00.000Z",
      endTime: "2026-09-11T18:30:00.000Z",
    });
    expect(result.error).toBe("End time must be after start time.");
    expect(result.durationMinutes).toBe(0);
  });

  it("allows an open session with a start time only", () => {
    const result = parseSessionTimes({
      startTime: "2026-09-11T18:30:00.000Z",
    });
    expect(result.error).toBeUndefined();
    expect(result.end).toBeNull();
    expect(result.durationMinutes).toBe(0);
  });

  it("rejects a missing start time", () => {
    expect(parseSessionTimes({ startTime: "" }).error).toBe(
      "Start time is required.",
    );
  });

  it("accepts datetime-local strings without converting to ISO first", () => {
    const result = parseSessionTimes({
      startTime: "2026-09-11T18:30",
      endTime: "2026-09-11T19:45",
    });
    expect(result.error).toBeUndefined();
    expect(result.durationMinutes).toBe(75);
  });
});

describe("isStaleOpenSession", () => {
  it("flags sessions left open for 3 hours or more", () => {
    const start = new Date("2026-09-11T12:00:00.000Z");
    const now = new Date("2026-09-11T15:00:00.000Z");
    expect(isStaleOpenSession(start, now)).toBe(true);
    expect(isStaleOpenSession(start, new Date("2026-09-11T14:59:00.000Z"))).toBe(
      false,
    );
  });
});

describe("datetime local helpers", () => {
  it("round-trips a datetime-local value to ISO", () => {
    const value = toDatetimeLocalValue("2026-09-11T18:30:00.000Z");
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    const iso = datetimeLocalToIso(value);
    expect(Number.isNaN(new Date(iso).getTime())).toBe(false);
  });
});
