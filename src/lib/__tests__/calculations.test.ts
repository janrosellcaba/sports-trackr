import { describe, expect, it } from "vitest";
import {
  addDaysISO,
  computeStreak,
  estimatedOneRm,
  formatChartDate,
  getTodayLocalDateISO,
  isDateKey,
  parseISODate,
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

describe("date keys", () => {
  it("formats local calendar dates as YYYY-MM-DD", () => {
    expect(getTodayLocalDateISO(new Date(2026, 8, 16, 23, 45))).toBe("2026-09-16");
  });

  it("rejects impossible calendar dates", () => {
    expect(isDateKey("2026-09-16")).toBe(true);
    expect(isDateKey("2026-02-31")).toBe(false);
    expect(isDateKey("2026-13-01")).toBe(false);
    expect(isDateKey("26-09-16")).toBe(false);
  });

  it("adds days without overflowing invalid keys", () => {
    expect(addDaysISO("2026-09-16", 1)).toBe("2026-09-17");
    expect(addDaysISO("2026-02-28", 1)).toBe("2026-03-01");
    expect(Number.isNaN(parseISODate("2026-02-31").getTime())).toBe(true);
  });

  it("formats chart dates with a stable month and day", () => {
    expect(formatChartDate("2026-09-16")).toBe("Sep 16");
  });
});
