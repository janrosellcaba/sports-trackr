import { describe, expect, it } from "vitest";
import { computeStreak, estimatedOneRm } from "@/lib/calculations";

describe("estimatedOneRm", () => {
  it("returns 0 for non-positive reps", () => {
    expect(estimatedOneRm(100, 0)).toBe(0);
    expect(estimatedOneRm(100, -2)).toBe(0);
  });

  it("returns the working weight for a single rep", () => {
    expect(estimatedOneRm(120, 1)).toBe(120);
  });

  it("applies the Epley formula", () => {
    expect(estimatedOneRm(100, 5)).toBe(116.7);
    expect(estimatedOneRm(80, 10)).toBe(106.7);
  });
});

describe("computeStreak", () => {
  it("returns 0 when there is no activity", () => {
    expect(computeStreak([], new Date("2026-09-11T12:00:00"))).toBe(0);
  });

  it("counts consecutive days including today", () => {
    const now = new Date("2026-09-11T18:00:00");
    expect(computeStreak(["2026-09-11", "2026-09-10", "2026-09-09"], now)).toBe(3);
  });

  it("allows yesterday to start the streak if today is empty", () => {
    const now = new Date("2026-09-11T18:00:00");
    expect(computeStreak(["2026-09-10", "2026-09-09"], now)).toBe(2);
  });
});
