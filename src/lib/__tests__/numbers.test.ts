import { describe, expect, it } from "vitest";
import { parseDecimal, parseOptionalDecimal } from "@/lib/numbers";

describe("parseDecimal", () => {
  it("accepts comma and dot decimals", () => {
    expect(parseDecimal("82,5")).toBe(82.5);
    expect(parseDecimal("82.5")).toBe(82.5);
    expect(parseDecimal(10)).toBe(10);
  });

  it("returns null for empty or garbage values", () => {
    expect(parseDecimal("")).toBeNull();
    expect(parseDecimal("  ")).toBeNull();
    expect(parseDecimal("kg")).toBeNull();
    expect(parseDecimal(null)).toBeNull();
  });
});

describe("parseOptionalDecimal", () => {
  it("treats blanks as omitted and rejects non-numeric text", () => {
    expect(parseOptionalDecimal(" ", "Weight")).toBeNull();
    expect(() => parseOptionalDecimal("nope", "Weight")).toThrow(
      "Weight must be a number.",
    );
  });
});
