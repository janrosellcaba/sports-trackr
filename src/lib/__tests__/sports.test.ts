import { describe, expect, it } from "vitest";
import {
  formatSportSummary,
  parsePace,
  parseSportSessionInput,
} from "@/lib/sports";

describe("parsePace", () => {
  it("accepts mm:ss and decimal minutes", () => {
    expect(parsePace("5:30")).toBe("5:30");
    expect(parsePace("5.5")).toBe("5:30");
  });

  it("rejects empty and invalid values", () => {
    expect(parsePace("")).toBeNull();
    expect(parsePace("fast")).toBeNull();
  });
});

describe("parseSportSessionInput", () => {
  it("requires distance and pace for running", () => {
    expect(
      parseSportSessionInput({
        type: "RUNNING",
        date: "2026-09-15",
        distanceKm: 8.2,
        pace: "5:15",
      }),
    ).toMatchObject({
      type: "RUNNING",
      distanceKm: 8.2,
      pace: "5:15",
      durationMinutes: null,
      effort: null,
    });
    expect(() =>
      parseSportSessionInput({ type: "RUNNING", date: "2026-09-15", pace: "5:15" }),
    ).toThrow("Distance (km) is required.");
  });

  it("requires time and effort for padel", () => {
    expect(
      parseSportSessionInput({
        type: "PADEL",
        date: "2026-09-15",
        durationMinutes: 90,
        effort: "EASY",
        notes: "Good match with Jan",
      }),
    ).toMatchObject({
      type: "PADEL",
      durationMinutes: 90,
      effort: "EASY",
      notes: "Good match with Jan",
    });
  });

  it("stores swimming distance in meters", () => {
    expect(
      parseSportSessionInput({
        type: "SWIMMING",
        date: "2026-09-15",
        distanceMeters: 1500,
        durationMinutes: 35,
      }),
    ).toMatchObject({
      distanceMeters: 1500,
      durationMinutes: 35,
      distanceKm: null,
    });
  });
});

describe("formatSportSummary", () => {
  it("joins the fields that are present", () => {
    expect(
      formatSportSummary({
        type: "RUNNING",
        durationMinutes: null,
        distanceKm: 8.2,
        distanceMeters: null,
        pace: "5:15",
        effort: null,
      }),
    ).toBe("8.2 km · 5:15 /km");
    expect(
      formatSportSummary({
        type: "PADEL",
        durationMinutes: 90,
        distanceKm: null,
        distanceMeters: null,
        pace: null,
        effort: "HARD",
      }),
    ).toBe("90 min · hard");
  });
});
