import { describe, expect, it } from "vitest";
import {
  activityKind,
  buildActivityWeeks,
  compareCounts,
  mondayOnOrBefore,
  parseAnalyticsPeriod,
  percentChange,
  periodLabel,
  perWeekRate,
  uniqueCount,
  unionCount,
  weekCounts,
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

describe("compareCounts", () => {
  it("hides a comparison when the previous period was empty", () => {
    expect(compareCounts(5, 0)).toBeNull();
    expect(compareCounts(5, 4)).toBe("5 vs 4");
  });
});

describe("activity weeks", () => {
  it("starts weeks on Monday and classifies gym, sport, both, and rest", () => {
    expect(mondayOnOrBefore("2026-09-20")).toBe("2026-09-14");
    expect(activityKind({ date: "2026-09-15", workouts: 1, sports: 1 })).toBe(
      "both",
    );

    const weeks = buildActivityWeeks([
      { date: "2026-09-16", workouts: 1, sports: 0 },
      { date: "2026-09-17", workouts: 0, sports: 1 },
      { date: "2026-09-18", workouts: 0, sports: 0 },
    ]);
    expect(weeks).toHaveLength(1);
    expect(weeks[0]?.start).toBe("2026-09-14");
    expect(weekCounts(weeks[0]!)).toEqual({
      gym: 1,
      sport: 1,
      rest: 1,
      activity: 2,
    });
  });
});
