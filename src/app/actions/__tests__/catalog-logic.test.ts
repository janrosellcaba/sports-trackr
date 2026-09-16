import { describe, expect, it } from "vitest";
import {
  mergeExerciseCatalog,
  mergeSupplementCatalog,
  parseCustomExerciseInput,
  parseCustomSupplementInput,
  parsePersonalRecordInput,
  isImprovedPersonalRecord,
  validateExerciseName,
  formatLift,
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

describe("custom supplement CRUD validation", () => {
  it("requires a name and dose, defaulting the icon", () => {
    expect(
      parseCustomSupplementInput({
        name: "Electrolytes",
        defaultDose: "1 scoop",
      }),
    ).toEqual({
      name: "Electrolytes",
      defaultDose: "1 scoop",
      iconOrType: "pill",
    });
    expect(() =>
      parseCustomSupplementInput({ name: "Electrolytes", defaultDose: "  " }),
    ).toThrow("Default dose is required.");
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

  it("lists only saved supplements", () => {
    expect(mergeSupplementCatalog([])).toEqual([]);
    const merged = mergeSupplementCatalog([
      {
        id: "s1",
        name: "Beta Alanine",
        defaultDose: "3g",
        iconOrType: "pill",
        createdAt: "2026-09-11T00:00:00.000Z",
      },
      {
        id: "s2",
        name: "Creatine",
        defaultDose: "5g",
        iconOrType: "pill",
        createdAt: "2026-09-11T00:00:00.000Z",
      },
    ]);
    expect(merged.map((item) => item.name)).toEqual(["Beta Alanine", "Creatine"]);
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
