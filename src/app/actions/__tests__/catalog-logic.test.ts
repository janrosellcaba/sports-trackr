import { describe, expect, it } from "vitest";
import {
  mergeExerciseCatalog,
  mergeSupplementCatalog,
  parseCustomExerciseInput,
  parseCustomSupplementInput,
  parseDoseHint,
  parsePersonalRecordInput,
  isImprovedPersonalRecord,
  validateExerciseName,
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

  it("parses gram and scoop hints from a dose string", () => {
    expect(parseDoseHint("30g / 1 scoop")).toEqual({
      amountGrams: 30,
      scoops: 1,
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
