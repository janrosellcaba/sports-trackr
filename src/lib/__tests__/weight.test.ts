import { describe, expect, it } from "vitest";
import { parseBodyWeightKg, weightChartDomain } from "@/lib/weight";

describe("parseBodyWeightKg", () => {
  it("keeps a normal weigh-in in kilograms", () => {
    expect(parseBodyWeightKg("82.4")).toBe(82.4);
    expect(parseBodyWeightKg(70)).toBe(70);
  });

  it("rejects a missing, tiny, or huge number", () => {
    expect(() => parseBodyWeightKg("")).toThrow("Weight is required.");
    expect(() => parseBodyWeightKg(10)).toThrow("That weight looks off.");
    expect(() => parseBodyWeightKg(500)).toThrow("That weight looks off.");
  });
});

describe("weightChartDomain", () => {
  it("pads a flat series so the line is not stuck to the edge", () => {
    const domain = weightChartDomain([80, 80]);
    expect(domain).not.toBeNull();
    if (!domain) return;
    expect(domain[0]).toBeLessThan(80);
    expect(domain[1]).toBeGreaterThan(80);
  });

  it("leaves room around a changing series", () => {
    expect(weightChartDomain([80, 82])).toEqual([79.5, 82.5]);
  });
});
