import { describe, expect, it } from "vitest";
import {
  mergeExerciseCatalog,
  parseCustomExerciseInput,
  parsePersonalRecordInput,
  isImprovedPersonalRecord,
  validateExerciseName,
  formatLift,
  effectiveWeightKg,
  sumLiftedKg,
} from "@/lib/catalog";

describe("custom exercise CRUD validation", () => {
  it("accepts a well-formed strength notebook row", () => {
    expect(
      parseCustomExerciseInput({
        name: "  Belt Squat  ",
        muscleId: "m1",
        workingWeight: 80,
        workingReps: 8,
        prWeight: 100,
        prReps: 5,
        prDate: "2026-09-16",
      }),
    ).toEqual({
      name: "Belt Squat",
      muscleId: "m1",
      workingWeight: 80,
      workingReps: 8,
      prWeight: 100,
      prReps: 5,
      prDate: "2026-09-16",
      dualWeights: false,
    });
  });

  it("rejects short names and invalid numbers", () => {
    expect(validateExerciseName("x")).toBe("Name must be at least 2 characters.");
    expect(() =>
      parseCustomExerciseInput({ name: "Hack Squat", workingWeight: -1 }),
    ).toThrow("Working weight must be a non-negative number.");
    expect(() =>
      parseCustomExerciseInput({ name: "Hack Squat", workingReps: 0 }),
    ).toThrow("Working reps must be a positive integer.");
  });

  it("parses locale comma decimals for working weight", () => {
    expect(
      parseCustomExerciseInput({
        name: "Hack Squat",
        workingWeight: "82,5",
        workingReps: "8",
      }),
    ).toMatchObject({
      workingWeight: 82.5,
      workingReps: 8,
    });
  });
});

describe("catalog merge", () => {
  it("lists only saved catalog rows, sorted by name", () => {
    const merged = mergeExerciseCatalog([
      {
        id: "c1",
        name: "Pendlay Row",
        muscleId: "m-back",
        muscleName: "Back",
        workingWeight: 70,
        workingReps: 6,
        prWeight: 90,
        prReps: 3,
        prDate: "2026-09-11",
        createdAt: "2026-09-11T00:00:00.000Z",
        dualWeights: false,
      },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      id: "c1",
      name: "Pendlay Row",
      muscleName: "Back",
    });
    expect(merged.some((item) => item.name === "Bench Press")).toBe(false);
  });
});

describe("personal records", () => {
  it("requires an existing exercise plus weight and reps", () => {
    expect(
      parsePersonalRecordInput({
        exerciseId: "e1",
        prWeight: 100,
        prReps: 5,
        prDate: "2026-09-16",
      }),
    ).toEqual({
      exerciseId: "e1",
      prWeight: 100,
      prReps: 5,
      prDate: "2026-09-16",
    });
    expect(() =>
      parsePersonalRecordInput({ prWeight: 100, prReps: 5 }),
    ).toThrow("Pick an exercise.");
    expect(() =>
      parsePersonalRecordInput({ exerciseId: "e1", prReps: 5 }),
    ).toThrow("PR weight is required.");
  });

  it("treats a first or heavier lift as a new PR", () => {
    expect(
      isImprovedPersonalRecord(null, { prWeight: 100, prReps: 5 }),
    ).toBe(true);
    expect(
      isImprovedPersonalRecord(
        { prWeight: 90, prReps: 3 },
        { prWeight: 92, prReps: 2 },
      ),
    ).toBe(true);
    expect(
      isImprovedPersonalRecord(
        { prWeight: 90, prReps: 3 },
        { prWeight: 90, prReps: 5 },
      ),
    ).toBe(true);
    expect(
      isImprovedPersonalRecord(
        { prWeight: 90, prReps: 3 },
        { prWeight: 90, prReps: 3 },
      ),
    ).toBe(false);
  });
});

describe("formatLift", () => {
  it("appends the selected mass unit", () => {
    expect(formatLift(80, 5)).toBe("80kg × 5");
    expect(formatLift(80, 5, "lb")).toBe("176.4lb × 5");
  });
});

describe("dual-weight load", () => {
  it("counts both dumbbells in analytics totals", () => {
    expect(
      parseCustomExerciseInput({
        name: "Incline Dumbbell Press",
        dualWeights: true,
        workingWeight: 30,
        workingReps: 6,
      }),
    ).toMatchObject({ dualWeights: true, workingWeight: 30 });
    expect(effectiveWeightKg(30, true)).toBe(60);
    expect(effectiveWeightKg(80, false)).toBe(80);
    expect(
      sumLiftedKg([
        { workingWeight: 30, dualWeights: true },
        { workingWeight: 80, dualWeights: false },
      ]),
    ).toBe(140);
  });
});
