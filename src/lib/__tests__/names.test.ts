import { describe, expect, it } from "vitest";
import { nameKey } from "@/lib/names";

describe("nameKey", () => {
  it("normalizes names for uniqueness", () => {
    expect(nameKey("  Bench Press  ")).toBe("bench press");
    expect(nameKey("Back")).toBe(nameKey("back"));
  });
});
