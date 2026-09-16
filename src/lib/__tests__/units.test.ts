import { describe, expect, it } from "vitest";
import {
  canonicalPace,
  displayPace,
  displayToKg,
  kgToDisplay,
  kmToDisplay,
  displayToKm,
} from "@/lib/units";

describe("mass conversion", () => {
  it("round-trips kilograms through pounds", () => {
    expect(kgToDisplay(80, "kg")).toBe(80);
    expect(kgToDisplay(80, "lb")).toBe(176.4);
    expect(displayToKg(176.4, "lb")).toBeCloseTo(80, 1);
  });
});

describe("distance conversion", () => {
  it("converts kilometers to miles", () => {
    expect(kmToDisplay(8.2, "km")).toBe(8.2);
    expect(kmToDisplay(8.047, "mi")).toBe(5);
    expect(displayToKm(5, "mi")).toBeCloseTo(8.047, 2);
  });
});

describe("pace conversion", () => {
  it("treats stored pace as minutes per kilometer", () => {
    expect(displayPace("5:00", "km")).toBe("5:00");
    expect(displayPace("5:00", "mi")).toBe("8:03");
    expect(canonicalPace("8:03", "mi")).toBe("5:00");
  });
});
