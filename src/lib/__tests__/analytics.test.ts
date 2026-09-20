import { describe, expect, it } from "vitest";
import {
  parseAnalyticsPeriod,
  percentChange,
  periodLabel,
  perWeekRate,
  uniqueCount,
  unionCount,
} from "@/lib/analytics";

describe("parseAnalyticsPeriod", () => {
  it("accepts 7, 30, 90, and 0 and defaults to 30", () => {
    expect(parseAnalyticsPeriod("7")).toBe(7);
    expect(parseAnalyticsPeriod(0)).toBe(0);
    expect(parseAnalyticsPeriod("nope")).toBe(30);
    expect(parseAnalyticsPeriod(3650)).toBe(30);
  });
});

describe("percentChange", () => {
  it("returns null when the previous period was empty", () => {
    expect(percentChange(4, 0)).toBeNull();
    expect(percentChange(10, 5)).toBe(100);
    expect(percentChange(5, 10)).toBe(-50);
  });
});

describe("periodLabel", () => {
  it("labels All as all time", () => {
    expect(periodLabel(9999)).toBe("All time");
    expect(periodLabel(30)).toBe("Last 30 days");
  });
});

describe("perWeekRate", () => {
  it("scales a period count into a weekly rate", () => {
    expect(perWeekRate(4, 7)).toBe(4);
    expect(perWeekRate(12, 30)).toBe(2.8);
    expect(perWeekRate(3, 0)).toBeNull();
  });
});

describe("day counts", () => {
  it("counts unique dates and unions gym with sport", () => {
    expect(uniqueCount(["2026-09-01", "2026-09-01", "2026-09-02"])).toBe(2);
    expect(
      unionCount(["2026-09-01", "2026-09-02"], ["2026-09-02", "2026-09-03"]),
    ).toBe(3);
  });
});
