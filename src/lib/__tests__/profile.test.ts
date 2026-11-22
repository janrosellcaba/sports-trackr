import { describe, expect, it } from "vitest";
import { parseProfileInput, profilePromptLines } from "@/lib/profile";

describe("parseProfileInput", () => {
  it("treats empty input as nothing provided", () => {
    const result = parseProfileInput({ heightCm: "", sex: "", profileNotes: "  " }, 2026);
    expect(result).toEqual({
      ok: true,
      value: {
        heightCm: null,
        sex: null,
        birthYear: null,
        goal: null,
        experience: null,
        profileNotes: null,
      },
    });
  });

  it("accepts valid values and rejects bad ones", () => {
    const ok = parseProfileInput(
      { heightCm: "181", sex: "male", birthYear: "1992", goal: "muscle", experience: "advanced" },
      2026,
    );
    expect(ok.ok && ok.value.heightCm).toBe(181);
    expect(parseProfileInput({ heightCm: "20" }, 2026).ok).toBe(false);
    expect(parseProfileInput({ sex: "robot" }, 2026).ok).toBe(false);
    expect(parseProfileInput({ birthYear: "2026" }, 2026).ok).toBe(false);
    expect(parseProfileInput({ profileNotes: "x".repeat(501) }, 2026).ok).toBe(false);
  });
});

describe("profilePromptLines", () => {
  it("only lists what was provided", () => {
    expect(profilePromptLines(null, "2026-10-06")).toEqual([]);
    const lines = profilePromptLines(
      {
        heightCm: 180,
        sex: "male",
        birthYear: 1990,
        goal: "strength",
        experience: null,
        profileNotes: "Left knee",
      },
      "2026-10-06",
      81,
    );
    expect(lines).toContain("- Sex: male");
    expect(lines).toContain("- Age: about 36 (born 1990)");
    expect(lines.some((l) => l.includes("BMI 25.0"))).toBe(true);
    expect(lines.some((l) => l.includes("Left knee"))).toBe(true);
    expect(lines.some((l) => l.includes("experience"))).toBe(false);
  });
});
