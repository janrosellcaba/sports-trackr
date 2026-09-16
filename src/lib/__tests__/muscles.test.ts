import { describe, expect, it } from "vitest";
import {
  averageIntensity,
  formatGymSummary,
  gymLoad,
  parseIntensity,
  parseMuscleName,
  sameMuscleName,
  validateMuscleName,
} from "@/lib/muscles";
import { parseNewMuscleName } from "@/lib/catalog";

describe("muscle catalog", () => {
  it("accepts a normal muscle name", () => {
    expect(parseMuscleName("  Lats  ")).toBe("Lats");
  });

  it("rejects short names", () => {
    expect(validateMuscleName("x")).toBe("Name must be at least 2 characters.");
  });

  it("blocks duplicate names ignoring case", () => {
    expect(() => parseNewMuscleName("back", [{ name: "Back" }])).toThrow(
      "A muscle with that name already exists.",
    );
    expect(parseNewMuscleName("Lats", [{ name: "Back" }])).toBe("Lats");
  });

  it("treats names as equal ignoring case", () => {
    expect(sameMuscleName("Back", "back")).toBe(true);
  });
});

describe("intensity", () => {
  it("accepts 1 through 5", () => {
    expect(parseIntensity(3)).toBe(3);
    expect(parseIntensity("5")).toBe(5);
  });

  it("rejects out of range values", () => {
    expect(() => parseIntensity(0)).toThrow("Intensity must be a whole number from 1 to 5.");
    expect(() => parseIntensity(6)).toThrow("Intensity must be a whole number from 1 to 5.");
    expect(() => parseIntensity(2.5)).toThrow("Intensity must be a whole number from 1 to 5.");
  });
});

describe("gym session summaries", () => {
  const hits = [
    { muscleName: "Back", intensity: 5 },
    { muscleName: "Chest", intensity: 4 },
    { muscleName: "Biceps", intensity: 2 },
  ];

  it("sums load and averages intensity", () => {
    expect(gymLoad(hits)).toBe(11);
    expect(averageIntensity(hits)).toBe(3.7);
  });

  it("formats the hardest muscles first", () => {
    expect(formatGymSummary(hits, 2)).toBe("Back 5 · Chest 4 +1");
  });
});
