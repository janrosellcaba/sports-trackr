import { describe, expect, it } from "vitest";
import {
  daysBetween,
  formatRecoveryDetail,
  formatRecoveryShort,
  recoveryAriaLabel,
} from "@/lib/recovery";

describe("daysBetween", () => {
  it("counts whole days between two date keys", () => {
    expect(daysBetween("2026-09-12", "2026-09-16")).toBe(4);
    expect(daysBetween("2026-09-16", "2026-09-16")).toBe(0);
  });
});

describe("recovery copy", () => {
  it("shortens days as Nd", () => {
    expect(formatRecoveryShort(1)).toBe("1d");
    expect(formatRecoveryShort(4)).toBe("4d");
  });

  it("names the last hit in the intensity sheet", () => {
    expect(formatRecoveryDetail({ daysAgo: 4, lastIntensity: 3 })).toBe(
      "4d · 3 Solid",
    );
  });

  it("builds tile aria labels", () => {
    expect(recoveryAriaLabel("Chest", { intensity: 3 }, undefined)).toBe(
      "Chest, 3 Solid this session",
    );
    expect(
      recoveryAriaLabel("Back", null, {
        muscleId: "m2",
        lastDate: "2026-09-12",
        lastIntensity: 4,
        daysAgo: 4,
      }),
    ).toBe("Back, last hit 4d ago");
    expect(recoveryAriaLabel("Abs", null, undefined)).toBe("Abs, not logged yet");
  });
});
