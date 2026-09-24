import { describe, expect, it } from "vitest";
import { parseTrackrImport, sportIdentity, supplementIdentity } from "@/lib/import-data";

const baseExport = {
  exportedAt: "2026-09-16T12:00:00.000Z",
  username: "test",
  gymSessions: [
    {
      id: "old",
      date: "2026-09-16",
      notes: null,
      hits: [{ muscleName: "Chest", intensity: 3 }],
    },
  ],
  sports: [
    {
      date: "2026-09-16",
      type: "RUNNING",
      durationMinutes: null,
      distanceKm: 8.2,
      distanceMeters: null,
      pace: "5:15",
      effort: null,
      notes: null,
    },
  ],
  supplements: [{ name: "Creatine", dose: "5g", date: "2026-09-16" }],
  muscles: [{ name: "Chest", sortOrder: 0 }],
  customExercises: [
    {
      name: "Bench Press",
      muscleName: "Chest",
      workingWeight: 80,
      workingReps: 5,
      prWeight: 100,
      prReps: 1,
      prDate: "2026-09-16",
      snapshots: [
        {
          date: "2026-09-16",
          workingWeight: 80,
          workingReps: 5,
          prWeight: 100,
          prReps: 1,
        },
      ],
    },
  ],
  preferences: { massUnit: "lb", distanceUnit: "mi" },
};

describe("parseTrackrImport", () => {
  it("accepts a Trackr JSON export", () => {
    const parsed = parseTrackrImport(baseExport);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.gymSessions[0]?.hits[0]?.intensity).toBe(3);
    expect(parsed.data.preferences.massUnit).toBe("lb");
    expect(parsed.data.exercises[0]?.dualWeights).toBeUndefined();
  });

  it("rejects invalid dates and intensity", () => {
    expect(
      parseTrackrImport({
        gymSessions: [{ date: "2026-02-31", hits: [{ muscleName: "Chest", intensity: 3 }] }],
      }).ok,
    ).toBe(false);
    expect(
      parseTrackrImport({
        gymSessions: [{ date: "2026-09-16", hits: [{ muscleName: "Chest", intensity: 9 }] }],
      }).ok,
    ).toBe(false);
  });

  it("rejects empty payloads", () => {
    expect(parseTrackrImport({}).ok).toBe(false);
    expect(parseTrackrImport("nope").ok).toBe(false);
  });

  it("preserves the two-weight flag when present", () => {
    const parsed = parseTrackrImport({
      ...baseExport,
      customExercises: [
        {
          ...baseExport.customExercises[0],
          dualWeights: true,
        },
      ],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.exercises[0]?.dualWeights).toBe(true);
  });

  it("accepts weigh-ins and rejects an unrealistic weight", () => {
    const parsed = parseTrackrImport({
      bodyWeights: [{ date: "2026-09-01", weightKg: 82.4 }],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.bodyWeights).toEqual([{ date: "2026-09-01", weightKg: 82.4 }]);

    expect(
      parseTrackrImport({
        bodyWeights: [{ date: "2026-09-01", weightKg: 5 }],
      }).ok,
    ).toBe(false);
  });
});

describe("import identities", () => {
  it("treats identical sport and supplement rows as duplicates", () => {
    const sport = baseExport.sports[0];
    expect(sportIdentity(sport)).toBe(sportIdentity({ ...sport }));
    expect(supplementIdentity(baseExport.supplements[0])).toBe(
      supplementIdentity({ name: " creatine ", dose: "5G", date: "2026-09-16" }),
    );
  });
});
