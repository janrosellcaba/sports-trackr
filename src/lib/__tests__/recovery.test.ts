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

import { recoveryRows, restDaysFor } from "@/lib/recovery";

describe("recoveryRows", () => {
  const muscles = [
    { id: "a", name: "Chest" },
    { id: "b", name: "Back" },
    { id: "c", name: "Legs" },
    { id: "d", name: "Calves" },
  ];
  it("classifies recovering, ready and neglected muscles", () => {
    expect(restDaysFor(5)).toBe(4);
    expect(restDaysFor(2)).toBe(1);
    const rows = recoveryRows(muscles, [
      { muscleId: "a", lastDate: "x", lastIntensity: 4, daysAgo: 1 },
      { muscleId: "b", lastDate: "x", lastIntensity: 3, daysAgo: 5 },
      { muscleId: "c", lastDate: "x", lastIntensity: 3, daysAgo: 12 },
    ]);
    expect(rows.map((r) => [r.name, r.status, r.daysLeft])).toEqual([
      ["Chest", "recovering", 2],
      ["Back", "ready", 0],
      ["Legs", "neglected", 0],
      ["Calves", "neglected", 0],
    ]);
  });
});
