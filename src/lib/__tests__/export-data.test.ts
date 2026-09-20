import { describe, expect, it } from "vitest";
import { buildExportCsv } from "@/lib/export-data";

describe("buildExportCsv", () => {
  it("includes PR snapshots so progression can be restored", () => {
    const csv = buildExportCsv({
      customExercises: [
        {
          name: "Bench Press",
          muscleName: "Chest",
          workingWeight: 80,
          workingReps: 6,
          prWeight: 90,
          prReps: 3,
          prDate: "2026-09-16",
          snapshots: [
            {
              date: "2026-08-01",
              workingWeight: 72,
              workingReps: 6,
              prWeight: 80,
              prReps: 3,
            },
          ],
        },
      ],
    });
    expect(csv).toContain("# exerciseSnapshots");
    expect(csv).toContain("Bench Press,2026-08-01,72,6,80,3");
    expect(csv).toContain("dualWeights");
  });
});
