import { describe, expect, it } from "vitest";
import {
  computeStreak,
  estimatedOneRm,
  sessionDurationMinutes,
  workoutTonnage,
} from "@/lib/calculations";

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

describe("workoutTonnage", () => {
  it("sums weight × reps across sets", () => {
    expect(
      workoutTonnage([
        { weight: 100, reps: 5 },
        { weight: 80, reps: 8 },
      ]),
    ).toBe(1140);
  });

  it("returns 0 for an empty session", () => {
    expect(workoutTonnage([])).toBe(0);
  });
});

describe("sessionDurationMinutes", () => {
  it("returns 0 when the session is still open", () => {
    expect(sessionDurationMinutes(new Date("2026-09-11T10:00:00Z"), null)).toBe(
      0,
    );
  });

  it("rounds elapsed gym time to whole minutes", () => {
    expect(
      sessionDurationMinutes(
        new Date("2026-09-11T10:00:00Z"),
        new Date("2026-09-11T11:15:20Z"),
      ),
    ).toBe(75);
  });
});

describe("computeStreak", () => {
  it("returns 0 when there is no activity", () => {
    expect(computeStreak([], new Date("2026-09-11T12:00:00"))).toBe(0);
  });

  it("counts consecutive days including today", () => {
    const now = new Date("2026-09-11T18:00:00");
    expect(
      computeStreak(
        [
          new Date("2026-09-11T08:00:00"),
          new Date("2026-09-10T22:00:00"),
          new Date("2026-09-09T07:00:00"),
        ],
        now,
      ),
    ).toBe(3);
  });

  it("allows yesterday to start the streak if today is empty", () => {
    const now = new Date("2026-09-11T18:00:00");
    expect(
      computeStreak(
        [new Date("2026-09-10T08:00:00"), new Date("2026-09-09T08:00:00")],
        now,
      ),
    ).toBe(2);
  });
});
