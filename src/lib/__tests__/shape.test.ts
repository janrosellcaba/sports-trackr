import { describe, expect, it } from "vitest";
import {
  buildShapeSeries,
  shapeReadout,
  sportShapePoints,
} from "@/lib/shape";

describe("sportShapePoints", () => {
  it("scores about one point per ten minutes", () => {
    expect(
      sportShapePoints({
        durationMinutes: 90,
        distanceKm: null,
        pace: null,
        effort: null,
      }),
    ).toBe(9);
  });

  it("raises a hard session and derives minutes from pace", () => {
    expect(
      sportShapePoints({
        durationMinutes: 90,
        distanceKm: null,
        pace: null,
        effort: "HARD",
      }),
    ).toBeCloseTo(10.8);
    expect(
      sportShapePoints({
        durationMinutes: null,
        distanceKm: 8,
        pace: "5:00",
        effort: null,
      }),
    ).toBe(4);
  });

  it("still counts a session that has no time", () => {
    expect(
      sportShapePoints({
        durationMinutes: null,
        distanceKm: null,
        pace: null,
        effort: null,
      }),
    ).toBe(6);
  });
});

describe("buildShapeSeries", () => {
  it("rises with training and falls on quiet days", () => {
    const doses = new Map<string, number>([
      ["2026-09-01", 10],
      ["2026-09-03", 10],
    ]);
    const series = buildShapeSeries(doses, "2026-09-04");
    expect(series.map((point) => point.date)).toEqual([
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
    ]);
    expect(series[1]?.score).toBeLessThan(series[0]?.score ?? 0);
    expect(series[2]?.score).toBeGreaterThan(series[1]?.score ?? 0);
    expect(series[3]?.score).toBeLessThan(series[2]?.score ?? 0);
  });

  it("starts at the first training day and stops at today", () => {
    const series = buildShapeSeries(new Map([["2026-09-20", 8]]), "2026-09-18");
    expect(series).toEqual([]);
  });
});

describe("shapeReadout", () => {
  it("compares the latest score with a week earlier", () => {
    const series = buildShapeSeries(new Map([["2026-09-17", 20]]), "2026-09-24");
    const readout = shapeReadout(series);
    expect(readout?.score).toBe(Math.round(series[series.length - 1]?.score ?? 0));
    expect(readout?.weekChange).toBeLessThan(0);
  });
});
